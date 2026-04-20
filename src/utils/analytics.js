import { format, getDay, differenceInDays, startOfMonth, endOfMonth } from 'date-fns'
import { CATEGORIES, CATEGORY_MAP, getCategoryById } from '../constants/categories.js'
import { formatINR } from './currency.js'

/**
 * Analytics Engine - all pure functions
 */

// Exclude these categories from "expenses" totals
const INCOME_CATEGORIES = new Set(['income'])
const TRANSFER_CATEGORIES = new Set(['transfers'])

/**
 * Get total income (all credit transactions)
 */
export function getTotalIncome(transactions) {
  return transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Get total expenses (all debit transactions)
 * @param {boolean} excludeTransfers - whether to exclude UPI/transfer transactions
 */
export function getTotalExpenses(transactions, excludeTransfers = false) {
  return transactions
    .filter(t => {
      if (t.type !== 'debit') return false
      if (excludeTransfers && TRANSFER_CATEGORIES.has(t.category)) return false
      return true
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Calculate savings rate as a percentage
 */
export function getSavingsRate(income, expenses) {
  if (!income || income <= 0) return 0
  const savings = income - expenses
  return Math.max(0, (savings / income) * 100)
}

/**
 * Get net savings amount
 */
export function getNetSavings(income, expenses) {
  return income - expenses
}

/**
 * Get spending by category
 */
export function getByCategory(transactions) {
  const totalExpenses = getTotalExpenses(transactions)

  const byCategory = {}
  for (const txn of transactions) {
    if (txn.type !== 'debit') continue
    const cat = txn.category || 'others'
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, count: 0, transactions: [] }
    }
    byCategory[cat].total += txn.amount
    byCategory[cat].count++
    byCategory[cat].transactions.push(txn)
  }

  return Object.entries(byCategory)
    .map(([catId, data]) => {
      const categoryMeta = getCategoryById(catId)
      return {
        category: catId,
        label: categoryMeta.label,
        color: categoryMeta.color,
        emoji: categoryMeta.emoji,
        total: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        transactions: data.transactions,
      }
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

/**
 * Get transactions grouped by month
 */
export function getByMonth(transactions) {
  const byMonth = {}

  for (const txn of transactions) {
    const monthKey = format(txn.date, 'MMM yyyy')
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { income: 0, expenses: 0, transactions: [], month: monthKey, date: txn.date }
    }
    if (txn.type === 'credit') byMonth[monthKey].income += txn.amount
    else byMonth[monthKey].expenses += txn.amount
    byMonth[monthKey].transactions.push(txn)
  }

  return Object.values(byMonth)
    .map(m => ({
      ...m,
      savings: m.income - m.expenses,
    }))
    .sort((a, b) => a.date - b.date)
}

/**
 * Get available months from transactions
 */
export function getAvailableMonths(transactions) {
  const months = new Set()
  for (const txn of transactions) {
    months.add(format(txn.date, 'MMM yyyy'))
  }
  return Array.from(months).sort((a, b) => {
    const da = new Date(a)
    const db = new Date(b)
    return da - db
  })
}

/**
 * Get top merchants by spend
 */
export function getTopMerchants(transactions, limit = 8) {
  const byMerchant = {}

  for (const txn of transactions) {
    if (txn.type !== 'debit') continue
    const name = normalizeMerchantName(txn.description)
    if (!byMerchant[name]) {
      byMerchant[name] = { name, total: 0, count: 0, category: txn.category }
    }
    byMerchant[name].total += txn.amount
    byMerchant[name].count++
  }

  return Object.values(byMerchant)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

function normalizeMerchantName(desc) {
  if (!desc) return 'Unknown'
  let s = desc.trim()
  // Take first 2–3 words for grouping
  const words = s.split(/\s+/)
  return words.slice(0, 2).join(' ')
}

/**
 * Get daily spend pattern
 */
export function getDailySpend(transactions) {
  const byDate = {}

  for (const txn of transactions) {
    const dateKey = format(txn.date, 'yyyy-MM-dd')
    if (!byDate[dateKey]) {
      byDate[dateKey] = { date: dateKey, debit: 0, credit: 0, count: 0, transactions: [] }
    }
    if (txn.type === 'debit') byDate[dateKey].debit += txn.amount
    else byDate[dateKey].credit += txn.amount
    byDate[dateKey].count++
    byDate[dateKey].transactions.push(txn)
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get largest expenses
 */
export function getLargestExpenses(transactions, limit = 10) {
  return transactions
    .filter(t => t.type === 'debit')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

/**
 * Get data by bank
 */
export function getByBank(statements) {
  return statements.map(stmt => {
    const txns = stmt.transactions || []
    const income = getTotalIncome(txns)
    const expenses = getTotalExpenses(txns)
    const categories = getByCategory(txns)
    const merchants = getTopMerchants(txns, 3)

    return {
      bank: stmt.bank,
      bankLabel: stmt.bankLabel,
      bankColor: stmt.bankColor,
      income,
      expenses,
      savings: income - expenses,
      transactions: txns,
      topCategory: categories[0] || null,
      topMerchant: merchants[0] || null,
      statementId: stmt.id,
      accountNumber: stmt.accountNumber,
      months: stmt.months || [],
    }
  })
}

/**
 * Get cross-month trend
 */
export function getCrossMonthTrend(transactions) {
  const byMonth = getByMonth(transactions)
  return byMonth.map(m => ({
    month: m.month,
    income: m.income,
    expenses: m.expenses,
    savings: m.savings,
    savingsRate: getSavingsRate(m.income, m.expenses),
    transactions: m.transactions,
  }))
}

/**
 * Detect subscriptions (recurring charges)
 */
export function getSubscriptions(transactions) {
  const byMerchantAmount = {}

  // Group debits by merchant+amount
  for (const txn of transactions) {
    if (txn.type !== 'debit') continue
    const merchant = normalizeMerchantName(txn.description)
    const key = `${merchant}_${Math.round(txn.amount)}`
    if (!byMerchantAmount[key]) {
      byMerchantAmount[key] = {
        merchant,
        amount: txn.amount,
        dates: [],
        category: txn.category,
        transactions: [],
      }
    }
    byMerchantAmount[key].dates.push(txn.date)
    byMerchantAmount[key].transactions.push(txn)
  }

  const subscriptions = []
  for (const data of Object.values(byMerchantAmount)) {
    if (data.dates.length < 2) continue

    // Sort dates
    data.dates.sort((a, b) => a - b)

    // Check if recurring monthly (25–35 day intervals)
    let isMonthly = true
    for (let i = 1; i < data.dates.length; i++) {
      const diff = differenceInDays(data.dates[i], data.dates[i - 1])
      if (diff < 20 || diff > 40) {
        isMonthly = false
        break
      }
    }

    // Check if recurring annual (330–370 day intervals)
    let isAnnual = false
    if (!isMonthly && data.dates.length >= 2) {
      const diff = differenceInDays(data.dates[data.dates.length - 1], data.dates[0])
      isAnnual = diff >= 330 && diff <= 400
    }

    if (isMonthly || isAnnual) {
      subscriptions.push({
        merchant: data.merchant,
        amount: data.amount,
        frequency: isMonthly ? 'monthly' : 'annual',
        lastCharged: data.dates[data.dates.length - 1],
        category: data.category,
        count: data.dates.length,
        annualCost: isMonthly ? data.amount * 12 : data.amount,
      })
    }
  }

  return subscriptions.sort((a, b) => b.amount - a.amount)
}

/**
 * Get weekday vs weekend spending
 */
export function getWeekdayVsWeekend(transactions) {
  let weekdayTotal = 0, weekdayCount = 0
  let weekendTotal = 0, weekendCount = 0

  for (const txn of transactions) {
    if (txn.type !== 'debit') continue
    const dow = getDay(txn.date) // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6
    if (isWeekend) {
      weekendTotal += txn.amount
      weekendCount++
    } else {
      weekdayTotal += txn.amount
      weekdayCount++
    }
  }

  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0
  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0
  const ratio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0

  return {
    weekday: { total: weekdayTotal, count: weekdayCount, average: weekdayAvg },
    weekend: { total: weekendTotal, count: weekendCount, average: weekendAvg },
    ratio: Math.round(ratio * 10) / 10,
    insight: weekendAvg > weekdayAvg
      ? `You spend ${ratio.toFixed(1)}× more per transaction on weekends vs weekdays`
      : `Your weekday spending is higher than weekends`,
  }
}

/**
 * Get savings rate by month
 */
export function getSavingsRateByMonth(transactions) {
  const byMonth = getByMonth(transactions)
  return byMonth.map(m => ({
    month: m.month,
    rate: getSavingsRate(m.income, m.expenses),
    income: m.income,
    expenses: m.expenses,
    savings: m.savings,
  }))
}

/**
 * Generate smart insights from analytics data
 */
export function getInsights(transactions, analytics = {}) {
  const insights = []

  if (!transactions || transactions.length === 0) return insights

  const income = getTotalIncome(transactions)
  const expenses = getTotalExpenses(transactions)
  const savings = income - expenses
  const savingsRate = getSavingsRate(income, expenses)
  const categories = getByCategory(transactions)
  const merchants = getTopMerchants(transactions, 5)
  const weekdayWeekend = getWeekdayVsWeekend(transactions)
  const subscriptions = getSubscriptions(transactions)

  // Insight 1: Top expense category
  if (categories.length > 0) {
    const top = categories[0]
    insights.push({
      icon: top.emoji,
      color: top.color,
      text: `${top.label} is your biggest expense — ${formatINR(top.total)} (${Math.round(top.percentage)}% of spending)`,
      type: 'top_category',
    })
  }

  // Insight 2: Savings rate
  if (income > 0) {
    const rateText = savingsRate >= 30 ? 'Great job!' : savingsRate >= 15 ? 'Doing okay.' : 'Consider cutting back.'
    insights.push({
      icon: '📈',
      color: savingsRate >= 20 ? '#16A34A' : '#D97706',
      text: `You saved ${Math.round(savingsRate)}% of your income (${formatINR(savings)}). ${rateText}`,
      type: 'savings_rate',
    })
  }

  // Insight 3: Subscriptions
  if (subscriptions.length > 0) {
    const totalSubs = subscriptions
      .filter(s => s.frequency === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0)
    if (totalSubs > 0) {
      insights.push({
        icon: '🔁',
        color: '#6366F1',
        text: `${subscriptions.filter(s => s.frequency === 'monthly').length} subscriptions cost you ${formatINR(totalSubs)}/month (${formatINR(totalSubs * 12)}/year)`,
        type: 'subscriptions',
      })
    }
  }

  // Insight 4: Largest expense
  const largest = getLargestExpenses(transactions, 1)[0]
  if (largest) {
    const cat = getCategoryById(largest.category)
    insights.push({
      icon: cat.emoji,
      color: cat.color,
      text: `Your largest expense was ${formatINR(largest.amount)} on ${cat.label} on ${format(largest.date, 'dd MMM')}`,
      type: 'largest_expense',
    })
  }

  // Insight 5: Weekday vs weekend
  if (weekdayWeekend.ratio > 1.5) {
    insights.push({
      icon: '📅',
      color: '#F59E0B',
      text: weekdayWeekend.insight,
      type: 'weekday_weekend',
    })
  }

  // Insight 6: Top merchant
  if (merchants.length > 0 && merchants[0].count > 3) {
    const m = merchants[0]
    insights.push({
      icon: '🛍️',
      color: '#8B5CF6',
      text: `You transacted with ${m.name} ${m.count} times, spending ${formatINR(m.total)} total`,
      type: 'top_merchant',
    })
  }

  // Insight 7: Zero spend days
  const dailySpend = getDailySpend(transactions)
  const spendFreeDays = dailySpend.filter(d => d.debit === 0).length
  if (spendFreeDays >= 3) {
    insights.push({
      icon: '✅',
      color: '#16A34A',
      text: `You had ${spendFreeDays} spending-free days — every saved day counts!`,
      type: 'spend_free',
    })
  }

  // Insight 8: Food delivery specific
  const foodDelivery = transactions.filter(t =>
    t.type === 'debit' &&
    (t.description?.toLowerCase().includes('swiggy') || t.description?.toLowerCase().includes('zomato'))
  )
  if (foodDelivery.length >= 4) {
    const foodTotal = foodDelivery.reduce((s, t) => s + t.amount, 0)
    insights.push({
      icon: '🍔',
      color: '#F97316',
      text: `Swiggy & Zomato: ${foodDelivery.length} orders totalling ${formatINR(foodTotal)} (avg ${formatINR(foodTotal / foodDelivery.length)}/order)`,
      type: 'food_delivery',
    })
  }

  // High spend warning
  if (categories.length > 0 && income > 0) {
    const highSpendCats = categories.filter(c => (c.total / income) * 100 > 30)
    if (highSpendCats.length > 0) {
      const cat = highSpendCats[0]
      insights.push({
        icon: '⚠️',
        color: '#D97706',
        text: `${cat.label} is ${Math.round((cat.total / income) * 100)}% of your income — above the recommended 30%`,
        type: 'high_spend_warning',
      })
    }
  }

  return insights
}

/**
 * Calculate days covered by transactions
 */
export function getDaysCovered(transactions) {
  if (!transactions || transactions.length === 0) return 0
  const dates = transactions.map(t => t.date.getTime())
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  return Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Detect likely duplicate transactions.
 * Two txns are a suspected duplicate when they share the same
 * type + amount (exact) + normalized description within ±1 day.
 * Returns { count, pairs } where pairs is an array of [id1, id2].
 */
export function detectDuplicates(transactions) {
  const pairs = []
  const seen = new Set()

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i]
      const b = transactions[j]
      const key = a.id + '|' + b.id
      if (seen.has(key)) continue

      if (
        a.type === b.type &&
        a.amount === b.amount &&
        normalizeMerchantName(a.description) === normalizeMerchantName(b.description) &&
        Math.abs(differenceInDays(a.date, b.date)) <= 1
      ) {
        pairs.push([a.id, b.id])
        seen.add(key)
      }
    }
  }

  return { count: pairs.length, pairs }
}

/**
 * Check if the covered period is very short (< 7 days).
 * Used to surface a warning banner on the dashboard.
 */
export function isShortPeriod(transactions) {
  if (!transactions || transactions.length < 2) return false
  return getDaysCovered(transactions) < 7
}

/**
 * Get monthly spend totals for a specific normalized merchant name.
 * Returns an array of totals sorted oldest-first — useful for sparklines.
 */
export function getMerchantMonthlyTrend(transactions, merchantName) {
  const months = {}
  for (const txn of transactions) {
    if (txn.type !== 'debit') continue
    const name = normalizeMerchantName(txn.description)
    if (name !== merchantName) continue
    const monthKey = format(txn.date, 'MMM yyyy')
    if (!months[monthKey]) months[monthKey] = 0
    months[monthKey] += txn.amount
  }
  return Object.entries(months)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([, total]) => total)
}

/**
 * Generate exactly 3 curated narrative insights for the InsightFeed component.
 * Prioritises: top-category → MoM change or savings alert → biggest transaction / top merchant.
 */
export function generateNarrativeInsights(transactions, monthlyData = []) {
  const insights = []

  const income = getTotalIncome(transactions)
  const expenses = getTotalExpenses(transactions)
  const savingsRate = getSavingsRate(income, expenses)
  const categories = getByCategory(transactions)
  const merchants = getTopMerchants(transactions, 5)

  // 1 — Top spend category
  if (categories.length > 0) {
    const top = categories[0]
    insights.push({
      icon: top.emoji || '💸',
      color: top.color,
      headline: `${top.label} topped your spending`,
      value: formatINR(top.total),
      subtext: `${Math.round(top.percentage)}% of all expenses`,
      type: 'top_category',
    })
  }

  // 2 — Month-over-month change OR savings health
  if (monthlyData.length >= 2) {
    const latest = monthlyData[monthlyData.length - 1]
    const prev = monthlyData[monthlyData.length - 2]
    const change = prev.expenses > 0 ? ((latest.expenses - prev.expenses) / prev.expenses) * 100 : 0
    if (Math.abs(change) >= 5) {
      insights.push({
        icon: change > 0 ? '📈' : '📉',
        color: change > 0 ? '#EF4444' : '#10B981',
        headline: `Spending ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% vs last month`,
        value: formatINR(Math.abs(latest.expenses - prev.expenses)),
        subtext: `${latest.month} vs ${prev.month}`,
        type: 'mom_change',
      })
    } else {
      _pushSavingsInsight(insights, income, expenses, savingsRate)
    }
  } else {
    _pushSavingsInsight(insights, income, expenses, savingsRate)
  }

  // 3 — Biggest single transaction OR top merchant OR weekend spend pattern
  const largest = getLargestExpenses(transactions, 1)[0]
  if (largest && largest.amount >= 10000) {
    const name = normalizeMerchantName(largest.description)
    insights.push({
      icon: '🚨',
      color: '#F97316',
      headline: 'Largest single transaction',
      value: formatINR(largest.amount),
      subtext: name,
      type: 'large_txn',
    })
  } else if (merchants.length > 0) {
    const m = merchants[0]
    insights.push({
      icon: '📦',
      color: '#8B5CF6',
      headline: `${m.name} visited most`,
      value: `${m.count} transactions`,
      subtext: formatINR(m.total) + ' total',
      type: 'top_merchant',
    })
  } else {
    // Final fallback: weekend vs weekday spending
    const debits = transactions.filter(t => t.type === 'debit')
    const weekendSpend = debits.filter(t => { const d = new Date(t.date).getDay(); return d === 0 || d === 6 }).reduce((s, t) => s + t.amount, 0)
    const weekdaySpend = debits.reduce((s, t) => s + t.amount, 0) - weekendSpend
    if (weekendSpend > 0 || weekdaySpend > 0) {
      const pct = Math.round((weekendSpend / (weekendSpend + weekdaySpend)) * 100)
      insights.push({
        icon: '🏖️',
        color: '#F59E0B',
        headline: 'Weekend spending share',
        value: `${pct}%`,
        subtext: `${formatINR(weekendSpend)} on weekends`,
        type: 'weekend_spend',
      })
    }
  }

  return insights.slice(0, 3)
}

function _pushSavingsInsight(insights, income, expenses, savingsRate) {
  if (income <= 0) return
  if (savingsRate < 10) {
    const pct = Math.round((expenses / income) * 100)
    insights.push({
      icon: '⚠️',
      color: '#EF4444',
      headline: 'High spending alert',
      value: `${pct}% of income spent`,
      subtext: 'Consider reducing non-essentials',
      type: 'savings_alert',
    })
  } else {
    insights.push({
      icon: savingsRate >= 30 ? '🎉' : '📈',
      color: '#10B981',
      headline: savingsRate >= 30 ? 'Excellent savings month!' : 'Healthy savings rate',
      value: `${Math.round(savingsRate)}% saved`,
      subtext: formatINR(income - expenses) + ' set aside',
      type: 'savings_health',
    })
  }
}
