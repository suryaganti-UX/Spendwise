import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatINR, formatAxisAmount } from '../../utils/currency.js'
import { Sparkline } from '../charts/Sparkline.jsx'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border-soft rounded-xl shadow-tooltip px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyComparison({ monthlyData = [], categoryTrends = [] }) {
  if (!monthlyData.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-secondary">Upload statements from multiple months to see trends</p>
      </div>
    )
  }

  const chartData = monthlyData.map(m => ({
    month: m.month,
    Income: m.income,
    Expenses: m.expenses,
    Savings: Math.max(0, m.savings),
  }))

  return (
    <div className="space-y-6">
      {/* Month summary cards */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {monthlyData.map((m, i) => {
          const prev = monthlyData[i - 1]
          const expenseChange = prev ? ((m.expenses - prev.expenses) / prev.expenses) * 100 : null
          const savingsRate = m.income > 0 ? Math.round(((m.income - m.expenses) / m.income) * 100) : 0

          return (
            <div key={m.month} className="flex-shrink-0 w-40 bg-bg-secondary border border-border-soft rounded-xl p-3">
              <p className="text-xs font-bold text-text-primary mb-2">{m.month}</p>
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-2xs">
                  <span className="text-text-hint">Income</span>
                  <span className="text-positive tabular-nums font-medium">{formatINR(m.income)}</span>
                </div>
                <div className="flex justify-between text-2xs">
                  <span className="text-text-hint">Expenses</span>
                  <span className="text-negative tabular-nums font-medium">{formatINR(m.expenses)}</span>
                </div>
              </div>
              {/* Color bar */}
              <div className="h-1.5 rounded-full bg-negative overflow-hidden">
                <div
                  className="h-full rounded-full bg-positive"
                  style={{ width: `${savingsRate}%` }}
                />
              </div>
              <p className="text-2xs text-text-hint mt-1 text-right">{savingsRate}% saved</p>
              {expenseChange !== null && (
                <p className={`text-2xs mt-1 ${Math.abs(expenseChange) < 5 ? 'text-text-hint' : expenseChange > 0 ? 'text-negative' : 'text-positive'}`}>
                  {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(0)}% expenses
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Month-over-Month</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#A8A49F' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#A8A49F' }} axisLine={false} tickLine={false} tickFormatter={formatAxisAmount} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive />
              <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category trend table */}
      {categoryTrends.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Category Trends</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="text-left pb-2 text-text-hint font-medium">Category</th>
                  {monthlyData.map(m => (
                    <th key={m.month} className="text-right pb-2 text-text-hint font-medium px-2">{m.month}</th>
                  ))}
                  <th className="text-right pb-2 text-text-hint font-medium px-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {categoryTrends.slice(0, 8).map(({ category, label, emoji, color, values }) => {
                  const first = values[0] || 0
                  const last = values[values.length - 1] || 0
                  const change = first > 0 ? ((last - first) / first) * 100 : 0
                  return (
                    <tr key={category} className="border-b border-border-soft/50 hover:bg-bg-tertiary">
                      <td className="py-2 flex items-center gap-1.5">
                        <span>{emoji}</span>
                        <span className="font-medium text-text-primary">{label}</span>
                      </td>
                      {values.map((v, i) => (
                        <td key={i} className="text-right py-2 px-2 tabular-nums text-text-secondary">
                          {v > 0 ? formatINR(v) : '—'}
                        </td>
                      ))}
                      <td className="text-right py-2 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Sparkline data={values} width={40} height={16} color={color} positive={false} />
                          <span className={`tabular-nums ${Math.abs(change) < 5 ? 'text-text-hint' : change > 0 ? 'text-negative' : 'text-positive'}`}>
                            {Math.abs(change) < 5 ? '→' : change > 0 ? '↑' : '↓'}
                            {Math.abs(change).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
