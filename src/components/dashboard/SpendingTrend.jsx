import React, { useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { format } from 'date-fns'
import { formatINR, formatAxisAmount } from '../../utils/currency.js'

const VIEWS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'category', label: 'By Category' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass rounded-xl shadow-card-dark px-3 py-2 text-xs">
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

export function SpendingTrend({ dailyData = [], categories = [] }) {
  const [view, setView] = useState('daily')
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#475569' : '#A8A49F'

  // Daily data
  const dailyChartData = useMemo(() => {
    if (!dailyData.length) return []
    return dailyData.map(d => ({
      date: format(new Date(d.date), 'dd MMM'),
      'Money In': d.credit,
      'Money Out': d.debit,
    }))
  }, [dailyData])

  // Weekly data — aggregate daily into 7-day buckets
  const weeklyChartData = useMemo(() => {
    if (!dailyData.length) return []
    const buckets = []
    for (let i = 0; i < dailyData.length; i += 7) {
      const slice = dailyData.slice(i, i + 7)
      const label = format(new Date(slice[0].date), 'dd MMM')
      buckets.push({
        date: label,
        'Money In': slice.reduce((s, d) => s + d.credit, 0),
        'Money Out': slice.reduce((s, d) => s + d.debit, 0),
      })
    }
    return buckets
  }, [dailyData])

  // Category data
  const categoryChartData = useMemo(() => {
    return categories
      .slice(0, 8)
      .map(c => ({ name: c.label, amount: c.total, color: c.color, emoji: c.emoji }))
  }, [categories])

  const chartData = view === 'weekly' ? weeklyChartData : dailyChartData

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-text-primary">Spending Over Time</p>
        <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="px-3 py-1 text-[11px] font-medium rounded-lg transition-all"
              style={
                view === v.key
                  ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }
                  : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
              }
              aria-pressed={view === v.key}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {view === 'category' ? (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={formatAxisAmount} width={48} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={76} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} isAnimationActive>
                {categoryChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={isDark ? 0.35 : 0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="trendOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={isDark ? 0.30 : 0.20} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisAmount}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Money In" stroke="#10B981" strokeWidth={2} fill="url(#trendIn)" isAnimationActive />
              <Area type="monotone" dataKey="Money Out" stroke="#EF4444" strokeWidth={2} fill="url(#trendOut)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
