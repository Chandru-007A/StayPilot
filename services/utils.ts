import type { AppNotification, HotelData, NotificationKind } from "@/lib/types"

export class ServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ServiceError"
  }
}

export function uid(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}${random}`
}

/** Simulated network latency so loading states are exercised like a real API. */
export function simulateLatency(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nextSequence(values: string[], prefix: string, start: number) {
  const numbers = values
    .map((value) => Number.parseInt(value.replace(prefix, ""), 10))
    .filter((value) => Number.isFinite(value))
  return Math.max(start - 1, ...numbers) + 1
}

export function pushNotification(
  draft: HotelData,
  notification: Omit<AppNotification, "id" | "read" | "createdAt"> & { kind: NotificationKind },
) {
  const prefs = draft.settings.notifications
  const enabled = notification.kind === "system" || prefs[notification.kind as keyof typeof prefs] !== false
  if (!enabled) return
  draft.notifications.unshift({ ...notification, id: uid("n"), read: false, createdAt: new Date().toISOString() })
  draft.notifications = draft.notifications.slice(0, 40)
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ServiceError(message)
}
