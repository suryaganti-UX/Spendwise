import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, BarChart2 as BarChart, Cpu, Check, ShieldCheck, Lock } from 'lucide-react'
import { reducer, INITIAL_STATE } from './store/reducer.js'
import { actions, ACTIONS } from './store/actions.js'
import { UploadZone } from './components/upload/UploadZone.jsx'
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
            onReset={() => dispatch(actions.reset())}
            darkMode={state.darkMode}
            onToggleTheme={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
            isDemoMode={state.isDemoMode}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  // Default: show upload zone (covers idle, uploading, processing, error states)
  const noFiles = !state.statements || state.statements.length === 0

  const HOW_IT_WORKS = [
    {
      Icon: Upload,
      title: 'Drop your statement PDFs',
      desc: 'HDFC, ICICI, SBI or Axis — one or more files, any date range.',
    },
    {
      Icon: Cpu,
      title: 'Parsed locally in your browser',
      desc: 'Every transaction is read and categorised on-device. Nothing touches a server.',
    },
    {
      Icon: BarChart,
      title: 'Full spending breakdown',
      desc: 'Categories, monthly trends, top merchants, and recurring charges.',
    },
  ]

  const BENEFITS = [
    'Spending by category',
    'Monthly trends',
    'Top merchants',
    'Recurring charges',
    'Budget tracking',
    'Multi-bank support',
  ]

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-soft bg-bg-secondary flex-shrink-0">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-text-primary text-[17px] tracking-tight">
            Spend<span className="text-accent">Wise</span>
          </span>
          <div className="hidden sm:flex items-center gap-2 text-text-hint">
            <ShieldCheck className="w-3.5 h-3.5 text-positive flex-shrink-0" />
            <span className="text-xs">Private by design · Indian bank statements</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl">

          {/* ── Two-panel hero card ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] border border-border-soft rounded-2xl overflow-hidden shadow-[0_2px_40px_rgba(0,0,0,0.06)]">

            {/* Left: Value proposition */}
            <div className="bg-bg-secondary p-10 xl:p-12 flex flex-col border-b lg:border-b-0 lg:border-r border-border-soft">

              {/* Main content block */}
              <div className="flex-1">
                {/* Eyebrow */}
                <p className="text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
                  Personal finance · India
                </p>

                {/* Headline */}
                <h1 className="text-[32px] lg:text-[36px] font-bold text-text-primary tracking-tight leading-[1.18] mb-4">
                  Know exactly where<br />your money went.
                </h1>

                {/* Supporting text */}
                <p className="text-sm text-text-secondary leading-[1.7] mb-8 max-w-[380px]">
                  Drop a bank statement PDF. SpendWise reads every transaction, assigns categories,
                  and shows you a clear financial picture — processed entirely in your browser.
                </p>

                {/* Benefits grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-8">
                  {BENEFITS.map(label => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-positive/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-positive" />
                      </div>
                      <span className="text-xs text-text-secondary">{label}</span>
                    </div>
                  ))}
                </div>

                {/* How it works — only when no files added */}
                {noFiles && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                  >
                    <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.14em] mb-4">
                      How it works
                    </p>
                    <div className="space-y-4">
                      {HOW_IT_WORKS.map(({ Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary leading-none mb-1">{title}</p>
                            <p className="text-[11px] text-text-secondary leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Trust bar — always at bottom */}
              <div className="mt-8 pt-6 border-t border-border-soft flex flex-wrap gap-x-5 gap-y-2">
                <span className="flex items-center gap-1.5 text-[11px] text-text-hint">
                  <ShieldCheck className="w-3.5 h-3.5 text-positive flex-shrink-0" />
                  No data sent anywhere
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-hint">
                  <Lock className="w-3.5 h-3.5 text-positive flex-shrink-0" />
                  No account required
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-hint">
                  <Cpu className="w-3.5 h-3.5 text-positive flex-shrink-0" />
                  Runs in your browser
                </span>
              </div>
            </div>

            {/* Right: Upload panel */}
            <div className="bg-bg-primary p-8 flex flex-col">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-text-primary">Upload your statement</h2>
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

          </div>
        </div>
      </main>

      <footer className="border-t border-border-soft py-4 text-center text-xs text-text-hint flex-shrink-0">
        Runs entirely in your browser — no server, no account, no data stored.
      </footer>
    </div>
  )
}
