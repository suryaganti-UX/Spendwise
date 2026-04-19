import React, { useMemo, useState } from 'react'
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { formatINR } from '../../utils/currency.js'

function getIntensityColor(amount) {
  if (amount === 0) return '#F7F5F1'
  if (amount < 500) return '#FED7AA'
  if (amount < 2000) return '#FB923C'
  if (amount < 5000) return '#EF4444'
  return '#B91C1C'
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CELL_SIZE = 14
const CELL_GAP = 2

export function CalendarHeatmap({ transactions = [] }) {
  const [tooltip, setTooltip] = useState(null)

  const { months, dailyMap } = useMemo(() => {
    if (!transactions.length) return { months: [], dailyMap: {} }

    const dailyMap = {}
    for (const txn of transactions) {
      if (!txn.date) continue
      const key = format(txn.date, 'yyyy-MM-dd')
      if (!dailyMap[key]) dailyMap[key] = { debit: 0, credit: 0, count: 0 }
      if (txn.type === 'debit') dailyMap[key].debit += txn.amount
      else dailyMap[key].credit += txn.amount
      dailyMap[key].count++
    }

    // Get unique months
    const monthSet = new Set()
    for (const txn of transactions) {
      if (txn.date) monthSet.add(format(txn.date, 'yyyy-MM'))
    }
    const months = [...monthSet].sort()
    return { months, dailyMap }
  }, [transactions])

  if (!months.length) return null

  // Stats
  const allDayData = Object.values(dailyMap)
  const maxSpend = Math.max(...allDayData.map(d => d.debit), 1)
  const busiest = Object.entries(dailyMap).sort((a, b) => b[1].debit - a[1].debit)[0]
  const zeroDays = months.reduce((sum, m) => {
    const [y, mo] = m.split('-').map(Number)
    const days = eachDayOfInterval({ start: new Date(y, mo - 1, 1), end: new Date(y, mo - 1, endOfMonth(new Date(y, mo - 1, 1)).getDate()) })
    return sum + days.filter(d => {
      const key = format(d, 'yyyy-MM-dd')
      return !dailyMap[key] || dailyMap[key].debit === 0
    }).length
  }, 0)
  const totalDebit = allDayData.reduce((s, d) => s + d.debit, 0)
  const totalDays = allDayData.length
  const avgDaily = totalDays > 0 ? totalDebit / totalDays : 0

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Spending Heatmap</h3>

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-0">
          {months.slice(0, 3).map(monthKey => {
            const [y, mo] = monthKey.split('-').map(Number)
            const firstDay = new Date(y, mo - 1, 1)
            const lastDay = endOfMonth(firstDay)
            const days = eachDayOfInterval({ start: firstDay, end: lastDay })

            // Pad to start from Monday
            const firstDow = getDay(firstDay) // 0=Sun
            const paddingStart = firstDow === 0 ? 6 : firstDow - 1
            const padded = [...Array(paddingStart).fill(null), ...days]

            // Chunk into weeks
            const weeks = []
            for (let i = 0; i < padded.length; i += 7) {
              weeks.push(padded.slice(i, i + 7))
            }

            return (
              <div key={monthKey} className="flex-shrink-0">
                <p className="text-xs font-semibold text-text-secondary mb-2">
                  {format(firstDay, 'MMMM yyyy')}
                </p>
                <div className="flex gap-0.5">
                  {/* Day labels */}
                  <div className="flex flex-col gap-0.5 mr-1">
                    {DAY_LABELS.map(label => (
                      <div
                        key={label}
                        className="text-2xs text-text-hint flex items-center"
                        style={{ height: CELL_SIZE }}
                      >
                        {label[0]}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                      {week.map((day, di) => {
                        if (!day) {
                          return (
                            <div
                              key={di}
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                            />
                          )
                        }

                        const key = format(day, 'yyyy-MM-dd')
                        const data = dailyMap[key] || { debit: 0, credit: 0, count: 0 }
                        const color = getIntensityColor(data.debit)
                        const hasCredit = data.credit > 0
                        const isMax = busiest && busiest[0] === key

                        return (
                          <div
                            key={di}
                            className="relative rounded-sm cursor-pointer transition-transform hover:scale-110"
                            style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: color }}
                            onMouseEnter={() => setTooltip({ key, data, date: day })}
                            onMouseLeave={() => setTooltip(null)}
                            aria-label={`${format(day, 'dd MMM')}: ${data.debit > 0 ? formatINR(data.debit) + ' spent' : 'No spending'}`}
                          >
                            {hasCredit && (
                              <div
                                className="absolute inset-0 rounded-sm ring-1"
                                style={{ ringColor: '#16A34A' }}
                              />
                            )}
                            {isMax && (
                              <div className="absolute -top-1 -right-1 text-2xs leading-none">⭐</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-bg-secondary border border-border-soft rounded-xl shadow-tooltip px-3 py-2 text-xs pointer-events-none"
          style={{ position: 'fixed', bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <p className="font-semibold text-text-primary mb-1">{format(tooltip.date, 'EEEE, dd MMM yyyy')}</p>
          {tooltip.data.debit > 0 && <p className="text-negative">Spent: {formatINR(tooltip.data.debit)}</p>}
          {tooltip.data.credit > 0 && <p className="text-positive">Received: {formatINR(tooltip.data.credit)}</p>}
          {tooltip.data.count > 0 && <p className="text-text-hint">{tooltip.data.count} transactions</p>}
          {tooltip.data.debit === 0 && tooltip.data.credit === 0 && <p className="text-text-hint">No activity</p>}
        </div>
      )}

      {/* Color legend */}
      <div className="flex items-center gap-2 mt-3 text-2xs text-text-hint">
        <span>₹0</span>
        {['#FED7AA', '#FB923C', '#EF4444', '#B91C1C'].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>₹5000+</span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-soft">
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {busiest ? `${format(new Date(busiest[0]), 'dd MMM')}` : '—'}
          </p>
          <p className="text-2xs text-text-hint">
            Busiest day {busiest ? `(${formatINR(busiest[1].debit)})` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary">{zeroDays} days</p>
          <p className="text-2xs text-text-hint">With no spending</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary tabular-nums">{formatINR(avgDaily)}</p>
          <p className="text-2xs text-text-hint">Avg daily spend</p>
        </div>
      </div>
    </div>
  )
}
