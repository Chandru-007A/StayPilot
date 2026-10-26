"use client"

import * as React from "react"

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string; icon?: React.ComponentType }>

type ChartContainerProps = React.ComponentPropsWithoutRef<"div"> & { config?: ChartConfig }
type ChartTooltipProps = Omit<React.ComponentPropsWithoutRef<"div">, "content"> & { content?: React.ReactNode }
type ChartTooltipContentProps = Omit<React.ComponentPropsWithoutRef<"div">, "content"> & {
  labelFormatter?: (value: unknown) => React.ReactNode
  formatter?: (value: unknown, name: string) => React.ReactNode
}
type ChartLegendProps = Omit<React.ComponentPropsWithoutRef<"div">, "content"> & { content?: React.ReactNode }

export const Chart = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
Chart.displayName = "Chart"

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ children, config: _config, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ children, content, ...props }, ref) => <div ref={ref} {...props}>{content ?? children}</div>,
)
ChartTooltip.displayName = "ChartTooltip"

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ children, labelFormatter: _labelFormatter, formatter: _formatter, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  ({ children, content, ...props }, ref) => <div ref={ref} {...props}>{content ?? children}</div>,
)
ChartLegend.displayName = "ChartLegend"

export const ChartLegendContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
ChartLegendContent.displayName = "ChartLegendContent"

export const ChartLegendItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
ChartLegendItem.displayName = "ChartLegendItem"
