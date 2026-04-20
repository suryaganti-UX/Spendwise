import React from 'react'

export function Card({ children, className = '', hover = true, glass = false, onClick, ...props }) {
  const base = glass
    ? 'glass rounded-2xl p-5 transition-all duration-200'
    : 'bg-bg-secondary border border-border-soft rounded-2xl p-5 transition-all duration-200'
  return (
    <div
      className={`${base} ${hover ? 'hover:shadow-card hover:-translate-y-px' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
