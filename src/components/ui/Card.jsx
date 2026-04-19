import React from 'react'

export function Card({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <div
      className={`bg-bg-secondary border border-border-soft rounded-2xl p-5 transition-all duration-200 ${hover ? 'hover:shadow-card hover:-translate-y-px' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
