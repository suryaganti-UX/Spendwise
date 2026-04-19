import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'

export function InsightBanner({ insights = [] }) {
  const [showAll, setShowAll] = useState(false)
  if (!insights || insights.length === 0) return null

  const displayed = showAll ? insights : insights.slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="bg-accent-light border border-accent/10 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-accent">What stands out</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence>
          {displayed.map((insight, i) => (
            <motion.div
              key={insight.type || i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-2 bg-bg-secondary rounded-xl px-3 py-2.5 border border-border-soft"
              style={{ borderLeft: `3px solid ${insight.color || '#355CDE'}` }}
            >
              <span className="text-base leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
                {insight.icon || '💡'}
              </span>
              <p className="text-xs text-text-primary leading-relaxed">{insight.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {insights.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center gap-1 text-xs text-accent font-medium hover:underline"
        >
          {showAll ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show {insights.length - 4} more insights</>
          )}
        </button>
      )}
    </motion.div>
  )
}
