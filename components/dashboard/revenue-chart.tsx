"use client"

import type { LucideIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCompactCurrency, formatCurrency, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const config = {
  payments: { label: "Room payments", color: "hsl(var(--chart-1))" },
  food: { label: "Room service", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

interface RevenueChartProps {
  series: { date: string; payments: number; food: number; total: number }[]
  periodTotal: number
  todayTotal: number
  icon: LucideIcon
  className?: string
}

export function RevenueChart({ series, periodTotal, todayTotal, className }: RevenueChartProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Revenue collected</CardTitle>
          <CardDescription>Payments received and delivered room-service orders, last 14 days</CardDescription>
        </div>
        <dl className="flex gap-6">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Today</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatCurrency(todayTotal)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">14 days</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatCurrency(periodTotal)}</dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={formatShortDate} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => formatCompactCurrency(value)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatShortDate(String(value))}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                      <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="payments" stackId="revenue" fill="var(--color-payments)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="food" stackId="revenue" fill="var(--color-food)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
