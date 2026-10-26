"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { consumeStorageWarning, useHotelData } from "@/services/store"
import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  )
}

/** Waits for the browser-only demo dataset before rendering children. */
export function DataGate({ children }: { children: React.ReactNode }) {
  const data = useHotelData()

  useEffect(() => {
    if (!data) return
    const warning = consumeStorageWarning()
    if (warning) toast.warning(warning)
  }, [data])

  if (!data) return <PageSkeleton />
  return <>{children}</>
}
