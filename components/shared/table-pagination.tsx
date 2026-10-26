"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TablePaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  noun?: string
}

export function TablePagination({ page, pageCount, total, pageSize, onPageChange, noun = "results" }: TablePaginationProps) {
  if (total === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="no-print flex items-center justify-between gap-4 border-t px-4 py-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground tabular-nums">{start}</span>
        {"–"}
        <span className="font-medium text-foreground tabular-nums">{end}</span> of{" "}
        <span className="font-medium text-foreground tabular-nums">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
