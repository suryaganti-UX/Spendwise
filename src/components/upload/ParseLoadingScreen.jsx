import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 'reading',      label: 'Reading your statement…',      sub: 'Extracting text from PDF pages' },
  { id: 'categorizing', label: 'Categorizing transactions…',   sub: 'Matching merchants to spending categories' },
  { id: 'building',     label: 'Building your money story…',   sub: 'Computing trends and insights' },
]

// Skeleton row shimmer
function SkeletonRow({ width = 'w-full', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={`h-2.5 rounded-full bg-white/10 ${width}`}
    />
  )
}

// Skeleton card
function SkeletonCard({ delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-4 space-y-3"
    >
      {children}
    </motion.div>
  )
}

export function ParseLoadingScreen({ statements = [] }) {
  const [stepIndex, setStepIndex] = useState(0)

  // Advance the step display based on actual per-file progress
  const avgProgress = (() => {
    const parsing = statements.filter(s => ['parsing', 'inspecting'].includes(s.parseStatus))
    if (!parsing.length) return 0
    return parsing.reduce((s, st) => s + (st.parseProgress || 0), 0) / parsing.length
  })()

  useEffect(() => {
    if (avgProgress < 30) setStepIndex(0)
    else if (avgProgress < 75) setStepIndex(1)
    else setStepIndex(2)
  }, [avgProgress])

  const parsingFiles = statements.filter(s =>
    ['parsing', 'inspecting', 'pending'].includes(s.parseStatus)
  )
  const doneFiles = statements.filter(s => s.parseStatus === 'done')
  const totalFiles = statements.length
  const overallPct = totalFiles > 0
    ? Math.round(statements.reduce((s, st) => s + (st.parseProgress || 0), 0) / totalFiles)
    : 0

  // Detected bank from first parsing file
  const detectedBank = parsingFiles[0]?.bank && parsingFiles[0].bank !== 'unknown'
    ? parsingFiles[0].bank
    : null

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex items-center justify-center overflow-hidden">
      {/* Ambient glow orbs — deep background decoration */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg px-6 py-10 flex flex-col items-center">

        {/* Animated logo pulse */}
        <motion.div
          className="relative mb-8 flex items-center justify-center"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }}
          />
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="14" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" opacity="0.4">
                <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="8s" repeatCount="indefinite" />
              </circle>
              <text x="16" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#10B981" fontFamily="Inter, sans-serif">₹</text>
            </svg>
          </div>
        </motion.div>

        {/* Active step label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="text-center mb-2"
          >
            <p className="text-xl font-bold text-text-primary tracking-tight">
              {STEPS[stepIndex].label}
            </p>
            {detectedBank && stepIndex === 0 && (
              <p className="text-xs text-text-hint mt-1 capitalize">{detectedBank.toUpperCase()} statement detected</p>
            )}
            {!detectedBank && (
              <p className="text-xs text-text-hint mt-1">{STEPS[stepIndex].sub}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Per-file progress items */}
        {totalFiles > 1 && (
          <div className="w-full mb-5 space-y-1.5">
            {statements.map(stmt => {
              const pct = stmt.parseStatus === 'done' ? 100 : (stmt.parseProgress || 0)
              const isDone = stmt.parseStatus === 'done'
              return (
                <div key={stmt.id} className="flex items-center gap-2.5">
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-positive flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-accent/40 flex-shrink-0">
                        <motion.div
                          className="w-full h-full rounded-full bg-accent/30"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                  }
                  <p className="flex-1 text-xs text-text-secondary truncate">{stmt.filename}</p>
                  <span className="text-[11px] tabular-nums text-text-hint">{Math.round(pct)}%</span>
                  <div className="w-16 h-1 rounded-full bg-border-soft overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pct}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Master progress bar */}
        <div className="w-full mb-3">
          <div className="w-full h-1.5 rounded-full bg-border-soft overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${overallPct}%`,
                background: 'linear-gradient(90deg, #10B981, #34D399)',
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-8" aria-hidden="true">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`h-1 rounded-full transition-all duration-400 ${
                i < stepIndex ? 'w-6 bg-positive' :
                i === stepIndex ? 'w-6 bg-accent' :
                'w-2 bg-border-medium'
              }`}
            />
          ))}
          <span className="text-[11px] text-text-hint ml-1 tabular-nums">{overallPct}%</span>
        </div>

        {/* Skeleton preview of the dashboard forming */}
        <div className="w-full space-y-3">
          {/* Summary cards row skeleton */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 0.08, 0.16, 0.24].map((d, i) => (
              <SkeletonCard key={i} delay={d}>
                <SkeletonRow width="w-8" delay={d} />
                <SkeletonRow width="w-14" delay={d + 0.1} />
                <SkeletonRow width="w-10" delay={d + 0.2} />
              </SkeletonCard>
            ))}
          </div>
          {/* Chart + breakdown row skeleton */}
          <div className="grid grid-cols-[1.8fr_1fr] gap-2">
            <SkeletonCard delay={0.1}>
              <SkeletonRow width="w-24" delay={0.1} />
              <div className="h-20 flex items-end gap-1 pt-2">
                {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.04, ease: 'easeOut' }}
                    className="flex-1 rounded-sm bg-accent/15 origin-bottom"
                    style={{ height: `${h}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </SkeletonCard>
            <SkeletonCard delay={0.15}>
              <SkeletonRow width="w-20" delay={0.15} />
              <div className="space-y-2 mt-1">
                {[['w-full', 0.2], ['w-4/5', 0.25], ['w-3/5', 0.3], ['w-2/5', 0.35]].map(([w, d], i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent/30 flex-shrink-0" />
                    <SkeletonRow width={w} delay={d} />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>
        </div>

        {/* Estimated time hint */}
        <p className="mt-6 text-[11px] text-text-hint text-center">
          This takes about 2–3 seconds · Nothing leaves your device
        </p>

      </div>
    </div>
  )
}
