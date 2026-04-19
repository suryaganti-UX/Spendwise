import React, { useMemo } from 'react'

/**
 * Tiny inline sparkline chart — pure SVG
 * Used in summary cards and trend tables
 */
export function Sparkline({ data = [], width = 60, height = 24, color = '#10B981', positive = true, strokeWidth = 1.5 }) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    return data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }))
  }, [data, width, height])

  if (!points) return <span style={{ width, height, display: 'inline-block' }} />

  // Build smooth path using quadratic Bezier
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpX = (prev.x + curr.x) / 2
    d += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`
  }

  // Fill area
  const fillPath = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  const trend = data[data.length - 1] > data[0]
  const lineColor = trend === positive ? '#16A34A' : '#DC2626'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <path d={fillPath} fill={lineColor} fillOpacity={0.12} />
      <path
        d={d}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
