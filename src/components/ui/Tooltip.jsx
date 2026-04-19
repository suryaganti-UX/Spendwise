import React, { useState, useRef, useEffect } from 'react'

export function Tooltip({ content, children, side = 'top' }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  const sideClass = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }[side] || 'bottom-full mb-2 left-1/2 -translate-x-1/2'

  return (
    <div
      className="relative inline-block"
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium bg-text-primary text-white rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${sideClass}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}
