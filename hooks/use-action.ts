"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

/** Runs a service call with pending state and success/error toasts. */
export function useAction() {
  const [pending, setPending] = useState(false)

  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string | ((value: T) => string | undefined)): Promise<Result<T>> => {
    setPending(true)
    try {
      const value = await fn()
      const message = typeof success === "function" ? success(value) : success
      if (message) toast.success(message)
      return { ok: true, value }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
      toast.error(message)
      return { ok: false, error: message }
    } finally {
      setPending(false)
    }
  }, [])

  return { pending, run }
}
