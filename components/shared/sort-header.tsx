"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortDirection } from "@/hooks/use-table-state"

interface SortHeaderProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K
  direction: SortDirection
  onSort: (key: K) => void
  className?: string
  align?: "left" | "right"
}

export function SortHeader<K extends string>({ label, sortKey, activeKey, direction, onSort, className, align = "left" }: SortHeaderProps<K>) {
  const active = sortKey === activeKey
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={className} aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" && "ml-auto flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  )
}
