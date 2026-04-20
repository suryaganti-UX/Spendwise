import React from 'react'
import { motion } from 'framer-motion'

export function InsightFeed({ insights = [] }) {
  if (!insights || insights.length === 0) return null

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }}
        aria-hidden="true"
      />

      <p className="text-[10px] font-semibold text-accent uppercase tracking-[0.15em] mb-4">
        {insights.length} Things We Noticed
      </p>

      {/* Horizontal scrollable chip row */}
      <div className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
        {insights.map((ins, i) => (
          <motion.div
            key={ins.type || i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 snap-start rounded-2xl p-4 flex flex-col gap-2 min-w-[200px] sm:min-w-[220px] flex-1"
            style={{
              background: `${ins.color}08`,
              border: `1px solid ${ins.color}25`,
              borderLeft: `3px solid ${ins.color}`,
            }}
            aria-label={`${ins.headline}: ${ins.value}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none" aria-hidden="true">{ins.icon}</span>
              <p className="text-xs font-semibold text-text-primary leading-snug">{ins.headline}</p>
            </div>
            <p className="font-display text-[1.35rem] leading-none tabular-nums" style={{ color: ins.color }}>
              {ins.value}
            </p>
            {ins.subtext && (
              <p className="text-[11px] text-text-hint">{ins.subtext}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
