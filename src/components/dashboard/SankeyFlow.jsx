import React, { useMemo, useState } from 'react'
import { formatINR } from '../../utils/currency.js'

const NODE_WIDTH = 20
const CANVAS_HEIGHT = 300
const CANVAS_WIDTH = 600
const LEFT_X = NODE_WIDTH
const RIGHT_X = CANVAS_WIDTH - NODE_WIDTH
const INCOME_NODE_HEIGHT = CANVAS_HEIGHT - 40
const NODE_GAP = 4

export function SankeyFlow({ income, categories = [] }) {
  const [hovered, setHovered] = useState(null)

  const { flows, rightNodes } = useMemo(() => {
    if (!income || income <= 0 || !categories.length) return { flows: [], rightNodes: [] }

    const totalExpenses = categories.reduce((s, c) => s + c.total, 0)
    const savings = income - totalExpenses
    const allItems = [...categories]
    if (savings > 0) {
      allItems.push({ category: 'savings', label: 'Savings', color: '#10B981', emoji: '💾', total: savings })
    }

    const totalForLayout = allItems.reduce((s, c) => s + c.total, 0)
    const usableHeight = CANVAS_HEIGHT - NODE_GAP * (allItems.length - 1) - 20
    const totalGap = NODE_GAP * (allItems.length - 1)
    const scaleH = (CANVAS_HEIGHT - 20 - totalGap) / totalForLayout

    let currentRightY = 10
    const rightNodes = allItems.map((item) => {
      const h = Math.max(8, item.total * scaleH)
      const node = {
        ...item,
        x: RIGHT_X,
        y: currentRightY,
        height: h,
        midY: currentRightY + h / 2,
      }
      currentRightY += h + NODE_GAP
      return node
    })

    // Income node proportions: map each flow to a vertical slice on the left node
    const incomeScaleH = INCOME_NODE_HEIGHT / totalForLayout
    let currentIncomeY = 10
    const flows = rightNodes.map((node) => {
      const flowH = Math.max(4, node.total * incomeScaleH)
      const flow = {
        ...node,
        startY: currentIncomeY,
        endY: currentIncomeY + flowH,
        flowHeight: flowH,
      }
      currentIncomeY += flowH
      return flow
    })

    return { flows, rightNodes }
  }, [income, categories])

  if (!flows.length) return null

  return (
    <div className="hidden lg:block">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Income → Spending Flow</h3>
      <div className="relative" style={{ height: CANVAS_HEIGHT }}>
        <svg
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          className="w-full h-full"
          role="img"
          aria-label="Sankey flow chart showing income distribution across spending categories"
        >
          {/* Income node */}
          <rect
            x={0}
            y={10}
            width={NODE_WIDTH}
            height={INCOME_NODE_HEIGHT}
            fill="#10B981"
            rx={4}
          />
          <text x={-4} y={10 + INCOME_NODE_HEIGHT / 2} textAnchor="end" fontSize={10} fill="#6B6864" dominantBaseline="middle">
            Income
          </text>
          <text x={-4} y={10 + INCOME_NODE_HEIGHT / 2 + 12} textAnchor="end" fontSize={9} fill="#A8A49F" dominantBaseline="middle">
            {formatINR(income)}
          </text>

          {/* Flows and right nodes */}
          {flows.map((flow, i) => {
            const isHov = hovered === i
            const cp1x = LEFT_X + (RIGHT_X - LEFT_X) * 0.35
            const cp2x = LEFT_X + (RIGHT_X - LEFT_X) * 0.65

            const topPath = `M ${LEFT_X} ${flow.startY} C ${cp1x} ${flow.startY}, ${cp2x} ${flow.midY - flow.flowHeight / 2}, ${RIGHT_X} ${flow.y}`
            const bottomPath = `L ${RIGHT_X} ${flow.y + flow.height} C ${cp2x} ${flow.midY + flow.flowHeight / 2}, ${cp1x} ${flow.endY}, ${LEFT_X} ${flow.endY} Z`
            const fillPath = topPath + ' ' + bottomPath

            return (
              <g key={i}>
                {/* Flow path */}
                <path
                  d={fillPath}
                  fill={flow.color}
                  fillOpacity={isHov ? 0.7 : 0.35}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />

                {/* Right node */}
                <rect
                  x={RIGHT_X}
                  y={flow.y}
                  width={NODE_WIDTH}
                  height={flow.height}
                  fill={flow.color}
                  rx={3}
                  opacity={isHov ? 1 : 0.85}
                />

                {/* Right label */}
                <text
                  x={RIGHT_X + NODE_WIDTH + 4}
                  y={flow.midY - 4}
                  fontSize={9.5}
                  fill="#111110"
                  dominantBaseline="middle"
                >
                  {flow.emoji} {flow.label}
                </text>
                <text
                  x={RIGHT_X + NODE_WIDTH + 4}
                  y={flow.midY + 6}
                  fontSize={9}
                  fill="#A8A49F"
                  dominantBaseline="middle"
                >
                  {formatINR(flow.total)}
                </text>

                {/* Tooltip */}
                {isHov && (
                  <foreignObject x={CANVAS_WIDTH / 2 - 60} y={CANVAS_HEIGHT / 2 - 30} width={120} height={60}>
                    <div className="bg-bg-secondary border border-border-soft rounded-xl px-3 py-2 text-xs shadow-tooltip">
                      <p className="font-semibold">{flow.label}</p>
                      <p className="text-text-secondary">{formatINR(flow.total)}</p>
                    </div>
                  </foreignObject>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
