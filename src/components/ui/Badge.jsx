import React from 'react'

export function Badge({ children, color, textColor, className = '' }) {
  const style = color ? { backgroundColor: color + '20', color: color, borderColor: color + '40' } : {}
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}
