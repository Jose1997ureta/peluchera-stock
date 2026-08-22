import {
  addMonths,
  addYears,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isWithinInterval,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardMetrics } from '../hooks/api'

export type SalesHistoryEntry = DashboardMetrics['salesHistory'][number]
export type PeriodBar = { label: string; amount: number }

function amountInInterval(history: SalesHistoryEntry[], start: Date, end: Date): number {
  return history.reduce((sum, entry) => {
    const date = new Date(`${entry.date}T00:00:00`)
    return isWithinInterval(date, { start, end }) ? sum + entry.amount : sum
  }, 0)
}

export function monthTotal(history: SalesHistoryEntry[], cursor: Date): number {
  return amountInInterval(history, startOfMonth(cursor), endOfMonth(cursor))
}

export function yearTotal(history: SalesHistoryEntry[], cursor: Date): number {
  return amountInInterval(history, startOfYear(cursor), endOfYear(cursor))
}

export function weeklyBreakdownForMonth(history: SalesHistoryEntry[], cursor: Date): PeriodBar[] {
  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const weekStarts = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 },
  )

  return weekStarts.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const clampedStart = isAfter(monthStart, weekStart) ? monthStart : weekStart
    const clampedEnd = isAfter(weekEnd, monthEnd) ? monthEnd : weekEnd
    return {
      label: format(weekStart, "d MMM", { locale: es }),
      amount: amountInInterval(history, clampedStart, clampedEnd),
    }
  })
}

export function monthlyBreakdownForYear(history: SalesHistoryEntry[], cursor: Date): PeriodBar[] {
  const yearStart = startOfYear(cursor)
  const yearEnd = endOfYear(cursor)
  const monthStarts = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  return monthStarts.map((monthStart) => ({
    label: format(monthStart, 'MMM', { locale: es }),
    amount: amountInInterval(history, startOfMonth(monthStart), endOfMonth(monthStart)),
  }))
}

export function formatMonthLabel(cursor: Date): string {
  const label = format(cursor, 'MMMM yyyy', { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatYearLabel(cursor: Date): string {
  return format(cursor, 'yyyy')
}

export function nextMonth(cursor: Date): Date {
  return addMonths(cursor, 1)
}

export function previousMonth(cursor: Date): Date {
  return addMonths(cursor, -1)
}

export function nextYear(cursor: Date): Date {
  return addYears(cursor, 1)
}

export function previousYear(cursor: Date): Date {
  return addYears(cursor, -1)
}

export function isCurrentMonth(cursor: Date, now: Date): boolean {
  return startOfMonth(cursor).getTime() === startOfMonth(now).getTime()
}

export function isCurrentYear(cursor: Date, now: Date): boolean {
  return startOfYear(cursor).getTime() === startOfYear(now).getTime()
}
