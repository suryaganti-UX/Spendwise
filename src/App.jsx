import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, BarChart2 as BarChart, Cpu, Check, ShieldCheck, Lock } from 'lucide-react'
import { reducer, INITIAL_STATE } from './store/reducer.js'
import { actions, ACTIONS } from './store/actions.js'
import { UploadZone } from './components/upload/UploadZone.jsx'
import { ParseLoadingScreen } from './components/upload/ParseLoadingScreen.jsx'
import { Dashboard } from './components/dashboard/Dashboard.jsx'
import { getPDFJS, extractPDFText, inspectPDF } from './utils/pdfWorker.js'
import { parseStatement } from './parsers/index.js'
import { categorizeAll } from './utils/categorize.js'
import { createMockStatements, createMockUploadPreview } from './utils/mockData.js'
import { downloadCSV } from './utils/export.js'
import { format } from 'date-fns'
import { getBankById } from './constants/banks.js'

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const processingRef = useRef(new Set())

  // Apply dark mode class
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.darkMode])

  // Keyboard shortcuts (only active when dashboard is visible)
  useEffect(() => {
    if (state.status !== 'complete') return
    function handler(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === '1') dispatch(actions.setView('overview'))
      if (e.key === '2') dispatch(actions.setView('by-bank'))
      if (e.key === '3') dispatch(actions.setView('by-month'))
      if (e.key === '4') dispatch(actions.setView('transactions'))
      if ((e.key === 'e' || e.key === 'E') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleExportCSV()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.status])

  // Pre-load pdfjs on mount to avoid delay on first upload
  useEffect(() => {
    getPDFJS().catch(() => {})
  }, [])

  /**
   * Called by UploadZone when files are dropped/selected.
   * The UploadZone already converts File objects into statement placeholder objects.
   * We just add them to state here — actual parsing happens on "Analyze All".
   */
  const handleFilesSelected = useCallback((newStatements) => {
    dispatch(actions.addFiles(newStatements))
  }, [])

  /**
   * Called when the user clicks "Analyze All" in UploadZone.
   * Iterates over all pending statements, extracts the embedded File,
   * runs the PDF parser, and updates state as parsing progresses.
   */
  const handleAnalyze = useCallback(async () => {
    const pendingStatements = state.statements.filter(s => s.parseStatus === 'pending')
    if (pendingStatements.length === 0) return

    // ── Phase 1: Inspect each pending file ────────────────────────────
    for (const stmt of pendingStatements) {
      const { id, file, filename } = stmt
      if (!file || processingRef.current.has(id)) continue

      processingRef.current.add(id)
      dispatch(actions.statementInspecting(id))

      // Duplicate detection: same filename + size against already-done statements
      const isDuplicate = state.statements.some(
        s => s.id !== id && s.parseStatus === 'done' && s.filename === filename && s.file?.size === file.size
      )
      if (isDuplicate) {
        dispatch(actions.statementDuplicate(id))
        processingRef.current.delete(id)
        continue
      }

      try {
        const result = await inspectPDF(file)
        if (result === 'password_required') {
          dispatch(actions.statementPasswordRequired(id))
          processingRef.current.delete(id)
          continue
        } else if (result === 'corrupted') {
          dispatch(actions.statementUnsupported(id, 'File appears corrupted or is not a valid PDF.'))
          processingRef.current.delete(id)
          continue
        }
        // 'ok' → leave as 'pending' for parse phase, but release lock
        processingRef.current.delete(id)
      } catch {
        dispatch(actions.statementUnsupported(id, 'Could not open this file.'))
        processingRef.current.delete(id)
        continue
      }
    }

    // ── Phase 2: Parse all still-pending files (including newly unlocked) ──
    const parseable = state.statements.filter(s => s.parseStatus === 'pending')

    for (const stmt of parseable) {
      const { id, file, bank } = stmt
      if (!file) {
        dispatch(actions.statementError(id, 'File reference missing. Please re-upload.'))
        continue
      }
      if (processingRef.current.has(id)) continue
      processingRef.current.add(id)

      try {
        dispatch(actions.updateParseProgress(id, 5, 0))

        const text = await extractPDFText(file, (progress) => {
          dispatch(actions.updateParseProgress(id, Math.floor(progress * 80), 0))
        }, stmt.pendingPassword || null)

        dispatch(actions.updateParseProgress(id, 80, 0))

        const parsed = parseStatement(text, bank !== 'unknown' ? bank : undefined)
        if (!parsed || !parsed.transactions?.length) {
          dispatch(actions.statementError(id, 'Could not parse transactions. Ensure this is a bank statement PDF.'))
          processingRef.current.delete(id)
          continue
        }

        const categorized = categorizeAll(parsed.transactions, state.userRules)
        const bankMeta = getBankById(parsed.bank)

        const monthSet = new Set()
        for (const txn of categorized) {
          if (txn.date) monthSet.add(format(txn.date, 'MMM yyyy'))
        }

        const statementData = {
          bank: parsed.bank || bank,
          bankLabel: bankMeta?.label || (parsed.bank || bank || 'unknown').toUpperCase(),
          bankColor: bankMeta?.color || stmt.bankColor || '#6B6864',
          accountNumber: parsed.accountNumber || null,
          period: parsed.period || null,
          months: [...monthSet].sort(),
          transactions: categorized,
          skippedLines: parsed.skippedLines || 0,
          totalLines: parsed.totalLines || 0,
        }

        dispatch(actions.statementParsed(id, statementData))
      } catch (err) {
        if (err.message === 'WRONG_PASSWORD') {
          dispatch(actions.statementWrongPassword(id))
        } else if (err.message === 'PASSWORD_PROTECTED') {
          dispatch(actions.statementPasswordRequired(id))
        } else if (err.message === 'NO_TEXT_LAYER') {
          dispatch(actions.statementError(id, 'This PDF appears to be a scanned image. We need a text-based PDF.'))
        } else {
          dispatch(actions.statementError(id, err.message || 'Failed to parse this file.'))
        }
      } finally {
        processingRef.current.delete(id)
      }
    }
  }, [state.statements, state.userRules])

  // Called when user enters a password for a locked file
  const handleSubmitPassword = useCallback((statementId, password) => {
    dispatch(actions.statementSetPassword(statementId, password))
    // Trigger analysis for this specific file (re-run analyze, it'll pick up the pending file)
    setTimeout(() => handleAnalyze(), 0)
  }, [handleAnalyze])

  // Called by "Continue with X files →" button — proceed to dashboard with partial data
  const handleAnalyzeAvailable = useCallback(() => {
    dispatch(actions.forceComplete())
  }, [])

  const [demoLoading, setDemoLoading] = useState(false)

  const handleLoadDemo = useCallback(() => {
    setDemoLoading(true)
    setTimeout(() => {
      const mockStatements = createMockStatements()
      dispatch(actions.loadDemo(mockStatements))
      setDemoLoading(false)
    }, 1400)
  }, [])

  const handleLoadUploadDemo = useCallback(() => {
    dispatch(actions.loadUploadDemo(createMockUploadPreview()))
  }, [])

  const handleExportCSV = useCallback(() => {
    const txns = []
    for (const stmt of state.statements) {
      for (const txn of stmt.transactions || []) txns.push(txn)
    }
    downloadCSV(txns, state.statements)
  }, [state.statements])

  // Fix: use the proper action creator so payload shape matches reducer
  const handleRecategorize = useCallback((txnId, newCategory) => {
    dispatch(actions.recategorizeTransaction(txnId, newCategory))
  }, [])

  // ── Render ────────────────────────────────────────────────────────────
  // status: 'idle' | 'uploading' | 'processing' → show upload screen
  // status: 'complete'                           → show dashboard
  // status: 'error'                              → show upload screen with errors

  if (state.status === 'complete') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Dashboard
            statements={state.statements}
            activeView={state.activeView}
            onViewChange={(view) => dispatch(actions.setView(view))}
            selectedBanks={state.selectedBanks}
            selectedMonths={state.selectedMonths}
            onToggleBank={(bank) => dispatch(actions.toggleBankFilter(bank))}
            onToggleMonth={(month) => dispatch(actions.toggleMonthFilter(month))}
            selectedStatements={state.selectedStatements || []}
            onToggleStatement={(id) => dispatch(actions.toggleStatementFilter(id))}
            includeTransfers={state.includeTransfers}
            onToggleTransfers={() => dispatch({ type: ACTIONS.TOGGLE_INCLUDE_TRANSFERS })}
            selectedCategory={state.selectedCategory}
            onCategorySelect={(cat) => dispatch(actions.setCategory(cat))}
            searchQuery={state.searchQuery}
            onSearchChange={(q) => dispatch(actions.setSearch(q))}
            typeFilter={state.typeFilter}
            onTypeFilterChange={(type) => dispatch(actions.setTypeFilter(type))}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            onSortChange={(by, order) => dispatch(actions.setSort(by, order))}
            onRecategorize={handleRecategorize}
            onReset={() => {
              if (window.confirm('Upload a new statement? Your current analysis will be cleared.')) {
                dispatch(actions.reset())
              }
            }}
            darkMode={state.darkMode}
            onToggleTheme={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
            isDemoMode={state.isDemoMode}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  // Parsing / loading state
  const isProcessing = state.statements.some(s =>
    ['parsing', 'inspecting'].includes(s.parseStatus)
  )
  if (isProcessing) {
    return <ParseLoadingScreen statements={state.statements} />
  }

  // Default: show upload zone (covers idle, uploading, error states)
  const noFiles = !state.statements || state.statements.length === 0

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* Ambient background glow orbs */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(16,185,129,0.09) 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(99,102,241,0.07) 0%, transparent 60%)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="glass-header border-b border-border-soft flex-shrink-0 relative z-10">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-text-primary text-[17px] tracking-tight">
            Spend<span className="text-accent" style={{ textShadow: '0 0 20px rgba(16,185,129,0.4)' }}>Wise</span>
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-positive/10 border border-positive/20">
            <ShieldCheck className="w-3.5 h-3.5 text-positive flex-shrink-0" />
            <span className="text-xs font-medium text-positive">100% local processing</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {noFiles ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* ── Hero section ── */}
                <div className="text-center mb-10">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
                    className="text-[11px] font-semibold text-accent uppercase tracking-[0.15em] mb-4"
                  >
                    Personal finance · India
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-[42px] lg:text-[52px] text-text-primary leading-[1.1] tracking-tight mb-4"
                  >
                    Your money story.
                    <br />
                    <span className="text-accent" style={{ textShadow: '0 0 40px rgba(16,185,129,0.3)' }}>Instantly.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                    className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto"
                  >
                    Drop your bank statement. We read it here, in your browser.{' '}
                    <span className="text-text-primary font-medium">Nothing leaves your device.</span>
                  </motion.p>
                </div>

                {/* ── Two-panel card ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] glass rounded-3xl overflow-hidden border border-white/[0.07] shadow-[0_8px_60px_rgba(0,0,0,0.35)]"
                >
                  {/* Left: trust signals */}
                  <div className="p-8 xl:p-10 flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                    <div className="flex-1">
                      {/* Bank trust badges */}
                      <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.14em] mb-4">
                        Supported banks
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 mb-8">
                        {[
                          { name: 'HDFC Bank', color: '#004C8F', bg: 'rgba(0,76,143,0.12)', border: 'rgba(0,76,143,0.25)' },
                          { name: 'ICICI Bank', color: '#F37024', bg: 'rgba(243,112,36,0.12)', border: 'rgba(243,112,36,0.25)' },
                          { name: 'SBI', color: '#4a5fc1', bg: 'rgba(43,59,143,0.12)', border: 'rgba(43,59,143,0.25)' },
                          { name: 'Axis Bank', color: '#c44d7a', bg: 'rgba(151,20,77,0.12)', border: 'rgba(151,20,77,0.25)' },
                        ].map(bank => (
                          <div
                            key={bank.name}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: bank.bg, border: `1px solid ${bank.border}` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: bank.color }} />
                            <span className="text-xs font-semibold" style={{ color: bank.color }}>{bank.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Features list */}
                      <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.14em] mb-4">
                        What you get
                      </p>
                      <div className="space-y-2.5 mb-8">
                        {[
                          'Spending by category',
                          'Monthly trend charts',
                          'Top merchants ranked',
                          'Recurring charges detected',
                          'Multi-bank merging',
                          'CSV export',
                        ].map(label => (
                          <div key={label} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
                              <Check className="w-2.5 h-2.5 text-positive" />
                            </div>
                            <span className="text-xs text-text-secondary">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Privacy badge */}
                    <div className="pt-6 border-t border-white/[0.06]">
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <ShieldCheck className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-positive">100% local processing</p>
                          <p className="text-[11px] text-text-hint mt-0.5 leading-relaxed">Your statement PDF never leaves your browser tab. No server, no account, no storage.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: upload panel */}
                  <div className="p-8 flex flex-col" style={{ background: 'rgba(0,0,0,0.15)' }}>
                    <div className="mb-5">
                      <h2 className="text-base font-bold text-text-primary">Upload your statement</h2>
                      <p className="text-[12px] text-text-hint mt-1">PDF format · any date range · HDFC, ICICI, SBI, Axis</p>
                    </div>
                    <UploadZone
                      statements={state.statements}
                      onFilesSelected={handleFilesSelected}
                      onAnalyze={handleAnalyze}
                      onLoadDemo={handleLoadDemo}
                      demoLoading={demoLoading}
                      onRemoveStatement={(id) => dispatch(actions.removeStatement(id))}
                      onSetBankManual={(id, bank) =>
                        dispatch({ type: ACTIONS.SET_BANK_MANUAL, payload: { statementId: id, bankId: bank } })
                      }
                      onSubmitPassword={handleSubmitPassword}
                      onAnalyzeAvailable={handleAnalyzeAvailable}
                      onLoadUploadDemo={handleLoadUploadDemo}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* Files added — compact header + upload zone */
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="glass rounded-3xl overflow-hidden border border-white/[0.07] shadow-[0_8px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-text-primary">Upload your statement</h2>
                    <p className="text-[12px] text-text-hint mt-0.5">PDF format · HDFC, ICICI, SBI, Axis</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-positive/10 border border-positive/20">
                    <ShieldCheck className="w-3 h-3 text-positive" />
                    <span className="text-[11px] font-medium text-positive">Local only</span>
                  </div>
                </div>
                <div className="p-6">
                  <UploadZone
                    statements={state.statements}
                    onFilesSelected={handleFilesSelected}
                    onAnalyze={handleAnalyze}
                    onLoadDemo={handleLoadDemo}
                    demoLoading={demoLoading}
                    onRemoveStatement={(id) => dispatch(actions.removeStatement(id))}
                    onSetBankManual={(id, bank) =>
                      dispatch({ type: ACTIONS.SET_BANK_MANUAL, payload: { statementId: id, bankId: bank } })
                    }
                    onSubmitPassword={handleSubmitPassword}
                    onAnalyzeAvailable={handleAnalyzeAvailable}
                    onLoadUploadDemo={handleLoadUploadDemo}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border-soft py-4 text-center text-xs text-text-hint flex-shrink-0">
        Runs entirely in your browser — no server, no account, no data stored.
      </footer>
    </div>
  )
}
