import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/motion/tabs'
import { formatCurrency } from '@/shared/utils/currency'
import type { DashboardMetrics } from '../hooks/api'
import {
  formatMonthLabel,
  formatYearLabel,
  isCurrentMonth,
  isCurrentYear,
  monthTotal,
  monthlyBreakdownForYear,
  nextMonth,
  nextYear,
  previousMonth,
  previousYear,
  weeklyBreakdownForMonth,
  yearTotal,
} from '../utils/salesPeriods'

function PeriodNav({
  label,
  total,
  onPrevious,
  onNext,
  nextDisabled,
}: {
  label: string
  total: number
  onPrevious: () => void
  onNext: () => void
  nextDisabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" onClick={onPrevious} aria-label="Período anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-24 text-center text-sm font-medium text-foreground">{label}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Período siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <p className="text-lg font-semibold text-foreground">{formatCurrency(total)}</p>
    </div>
  )
}

function PeriodChart({ bars }: { bars: { label: string; amount: number }[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SalesPeriodCard({ salesHistory }: { salesHistory: DashboardMetrics['salesHistory'] }) {
  const now = useMemo(() => new Date(), [])
  const [monthCursor, setMonthCursor] = useState(now)
  const [yearCursor, setYearCursor] = useState(now)

  const monthBars = useMemo(() => weeklyBreakdownForMonth(salesHistory, monthCursor), [salesHistory, monthCursor])
  const yearBars = useMemo(() => monthlyBreakdownForYear(salesHistory, yearCursor), [salesHistory, yearCursor])

  return (
    <Tabs defaultValue="month" variant="pill">
      <TabsList className="bg-muted">
        <TabsTrigger value="month">Mes</TabsTrigger>
        <TabsTrigger value="year">Año</TabsTrigger>
      </TabsList>

      <TabsContent value="month" className="space-y-3 pt-3">
        <PeriodNav
          label={formatMonthLabel(monthCursor)}
          total={monthTotal(salesHistory, monthCursor)}
          onPrevious={() => setMonthCursor(previousMonth(monthCursor))}
          onNext={() => setMonthCursor(nextMonth(monthCursor))}
          nextDisabled={isCurrentMonth(monthCursor, now)}
        />
        <PeriodChart bars={monthBars} />
      </TabsContent>

      <TabsContent value="year" className="space-y-3 pt-3">
        <PeriodNav
          label={formatYearLabel(yearCursor)}
          total={yearTotal(salesHistory, yearCursor)}
          onPrevious={() => setYearCursor(previousYear(yearCursor))}
          onNext={() => setYearCursor(nextYear(yearCursor))}
          nextDisabled={isCurrentYear(yearCursor, now)}
        />
        <PeriodChart bars={yearBars} />
      </TabsContent>
    </Tabs>
  )
}
