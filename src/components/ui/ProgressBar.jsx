import React from 'react'

export function ProgressBar({ value, max = 100, color = '#355CDE', height = 4, className = '', animated = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`bg-gray-100 rounded-full overflow-hidden ${className}`} style={{ height }}>
      <div
        className={`h-full rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
        style={{ width: `${pct}%`, backgroundColor: color }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  )
}
