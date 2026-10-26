"use client"

import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export function useSort<K extends string>(initialKey: K, initialDirection: SortDirection = "desc") {
  const [sortKey, setSortKey] = useState<K>(initialKey)
  const [direction, setDirection] = useState<SortDirection>(initialDirection)
  const toggle = (key: K) => {
    if (key === sortKey) setDirection((current) => (current === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setDirection(key === initialKey ? initialDirection : "asc")
    }
  }
  return { sortKey, direction, toggle }
}

export function usePagination<T>(items: T[], pageSize = 10, resetKey = "") {
  const [state, setState] = useState({ page: 1, key: resetKey })
  const page = state.key === resetKey ? state.page : 1
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)
  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize])
  return {
    page: current,
    pageCount,
    pageItems,
    total: items.length,
    pageSize,
    setPage: (next: number) => setState({ page: Math.max(1, Math.min(next, pageCount)), key: resetKey }),
  }
}

export function compareValues(a: string | number, b: string | number, direction: SortDirection) {
  const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))
  return direction === "asc" ? result : -result
}
