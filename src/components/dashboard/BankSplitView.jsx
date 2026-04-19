import React from 'react'
import { formatINR } from '../../utils/currency.js'
import { BANKS } from '../../constants/banks.js'
import { DonutChart } from '../charts/DonutChart.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'

export function BankSplitView({ bankData = [] }) {
  if (!bankData.length) return (
    <div className="py-12 text-center text-sm text-text-secondary">
      Upload statements from multiple banks to see comparison
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankData.map(data => {
          const bank = BANKS[data.bank]
          if (!bank) return null

          const savingsRate = data.income > 0
            ? Math.round(((data.income - data.expenses) / data.income) * 100)
            : 0

          const donutSegments = data.topCategories?.slice(0, 6).map(c => ({
            label: c.label,
            value: c.total,
            color: c.color,
            percentage: c.percentage,
            category: c.category,
          })) || []

          return (
            <div key={data.bank} className="bg-bg-secondary border border-border-soft rounded-2xl overflow-hidden">
              {/* Bank header */}
              <div className="px-4 py-3" style={{ backgroundColor: bank.color }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{bank.label}</h3>
                  {data.accountNumber && (
                    <span className="text-xs text-white/70">{data.accountNumber}</span>
                  )}
                </div>
                {data.months?.length > 0 && (
                  <p className="text-xs text-white/70 mt-0.5">{data.months.join(', ')}</p>
                )}
              </div>

              <div className="p-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-2xs text-text-hint">Money In</p>
                    <p className="text-sm font-bold text-positive tabular-nums">{formatINR(data.income)}</p>
                  </div>
                  <div>
                    <p className="text-2xs text-text-hint">Money Out</p>
                    <p className="text-sm font-bold text-negative tabular-nums">{formatINR(data.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-2xs text-text-hint">Net</p>
                    <p className={`text-sm font-bold tabular-nums ${data.savings >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatINR(Math.abs(data.savings))}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs text-text-hint">Transactions</p>
                    <p className="text-sm font-bold text-text-primary">{data.transactions?.length || 0}</p>
                  </div>
                </div>

                {/* Savings bar */}
                {data.income > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-2xs text-text-hint mb-1">
                      <span>Savings rate</span>
                      <span className={savingsRate >= 20 ? 'text-positive' : 'text-warning'}>{savingsRate}%</span>
                    </div>
                    <ProgressBar
                      value={Math.max(0, savingsRate)}
                      max={100}
                      color={savingsRate >= 20 ? '#16A34A' : '#D97706'}
                      height={5}
                    />
                  </div>
                )}

                {/* Mini donut */}
                {donutSegments.length > 0 && (
                  <div className="flex items-center gap-3">
                    <DonutChart
                      segments={donutSegments}
                      size={100}
                      centerLabel={null}
                      centerSubLabel={null}
                    />
                    <div className="flex-1 space-y-1">
                      {donutSegments.slice(0, 4).map(seg => (
                        <div key={seg.category} className="flex items-center gap-1.5 text-2xs">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-text-secondary truncate">{seg.label}</span>
                          <span className="ml-auto text-text-hint tabular-nums">{formatINR(seg.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top category */}
                {data.topCategory && (
                  <p className="mt-3 text-xs text-text-secondary">
                    Top: <span className="font-semibold text-text-primary">{data.topCategory.emoji} {data.topCategory.label}</span>
                    {' '}— {formatINR(data.topCategory.total)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
