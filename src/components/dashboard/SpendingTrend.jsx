import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { formatINR, formatAxisAmount } from '../../utils/currency.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-bg-secondary border border-border-soft rounded-xl shadow-tooltip px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {formatINR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SpendingTrend({ dailyData = [] }) {
  const chartData = useMemo(() => {
    if (!dailyData.length) return []
    return dailyData.map(d => ({
      date: format(new Date(d.date), 'dd MMM'),
      'Money In': d.credit,
      'Money Out': d.debit,
    }))
  }, [dailyData])

  if (!chartData.length) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Spending Pattern</h3>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#A8A49F' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#A8A49F' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisAmount}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Money In"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#colorIn)"
              isAnimationActive
            />
            <Area
              type="monotone"
              dataKey="Money Out"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#colorOut)"
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
