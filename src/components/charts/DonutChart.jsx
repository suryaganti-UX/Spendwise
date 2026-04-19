import React, { useState, useRef, useEffect } from 'react'
import { formatINR } from '../../utils/currency.js'

/**
 * Custom SVG Donut Chart
 * Does not use Recharts — pure SVG for flexibility
 */

const GAP_DEGREES = 1.5 // gap between segments

export function DonutChart({
  segments = [],
  size = 200,
  centerLabel = '',
  centerSubLabel = '',
  onSegmentClick,
  selectedSegment = null,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.45
  const innerR = size * 0.275

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  // Calculate arcs
  let currentAngle = -90 // start at top
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total
    const degrees = fraction * 360 - GAP_DEGREES
    const startAngle = currentAngle + GAP_DEGREES / 2
    const endAngle = startAngle + degrees
    currentAngle += fraction * 360

    return {
      ...seg,
      startAngle,
      endAngle,
      midAngle: startAngle + degrees / 2,
      fraction,
      index: i,
    }
  })

  function polarToXY(angle, r) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function describeArc(startAngle, endAngle, r1, r2) {
    const s1 = polarToXY(startAngle, r1)
    const e1 = polarToXY(endAngle, r1)
    const s2 = polarToXY(endAngle, r2)
    const e2 = polarToXY(startAngle, r2)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return [
      `M ${s1.x} ${s1.y}`,
      `A ${r1} ${r1} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${r2} ${r2} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ')
  }

  function handleMouseMove(e, seg) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 48,
      seg,
    })
  }

  const isLowPerfDevice = typeof navigator !== 'undefined' && navigator.hardwareConcurrency < 4

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Donut chart showing spending distribution. Total: ${formatINR(total)}`}
        role="img"
      >
        {arcs.map((arc) => {
          const isHovered = hoveredSegment === arc.index
          const isSelected = selectedSegment === arc.category
          const isOther = selectedSegment && !isSelected

          // Lift hovered/selected segment outward
          let translateX = 0
          let translateY = 0
          if (isHovered || isSelected) {
            const midRad = (arc.midAngle * Math.PI) / 180
            translateX = Math.cos(midRad) * 4
            translateY = Math.sin(midRad) * 4
          }

          const path = describeArc(arc.startAngle, arc.endAngle, outerR, innerR)
          const opacity = isOther ? 0.3 : 1

          return (
            <path
              key={arc.index}
              d={path}
              fill={arc.color}
              opacity={opacity}
              style={{
                transform: `translate(${translateX}px, ${translateY}px)`,
                transition: isLowPerfDevice ? 'none' : 'transform 200ms ease, opacity 200ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                setHoveredSegment(arc.index)
                handleMouseMove(e, arc)
              }}
              onMouseMove={(e) => handleMouseMove(e, arc)}
              onMouseLeave={() => {
                setHoveredSegment(null)
                setTooltip(null)
              }}
              onClick={() => onSegmentClick && onSegmentClick(arc.category)}
              tabIndex={0}
              role="button"
              aria-label={`${arc.label}: ${formatINR(arc.value)} (${arc.percentage?.toFixed(1)}%)`}
              onKeyDown={(e) => e.key === 'Enter' && onSegmentClick && onSegmentClick(arc.category)}
            />
          )
        })}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={size * 0.1}
          fontWeight="700"
          fill="#111110"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + size * 0.07}
          textAnchor="middle"
          fontSize={size * 0.06}
          fill="#6B6864"
        >
          {centerSubLabel}
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-bg-secondary border border-border-soft rounded-xl shadow-tooltip px-3 py-2 text-xs pointer-events-none z-10"
          style={{ left: Math.min(tooltip.x, size - 120), top: Math.max(0, tooltip.y) }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tooltip.seg.color }} />
            <span className="font-semibold text-text-primary">{tooltip.seg.label}</span>
          </div>
          <div className="text-text-secondary tabular-nums">
            {formatINR(tooltip.seg.value)} · {tooltip.seg.percentage?.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}
