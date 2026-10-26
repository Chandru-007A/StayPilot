import { DATA_VERSION } from "@/lib/mock-data"
import type { HotelData } from "@/lib/types"

/**
 * localStorage persistence for NON-SENSITIVE demo records only.
 * No passwords, tokens or payment card data are ever written here.
 */
export const STORAGE_KEY = "staypilot.demo-data.v1"

export type LoadResult =
  | { ok: true; data: HotelData }
  | { ok: false; reason: "unavailable" | "empty" | "corrupt" | "outdated" }

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage
  } catch {
    return false
  }
}

export function loadData(): LoadResult {
  if (!hasStorage()) return { ok: false, reason: "unavailable" }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ok: false, reason: "empty" }
    const parsed = JSON.parse(raw) as Partial<HotelData>
    if (parsed.version !== DATA_VERSION) return { ok: false, reason: "outdated" }
    if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.rooms) || !parsed.settings) {
      return { ok: false, reason: "corrupt" }
    }
    return { ok: true, data: parsed as HotelData }
  } catch {
    return { ok: false, reason: "corrupt" }
  }
}

export function saveData(data: HotelData): boolean {
  if (!hasStorage()) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("StayPilot: unable to persist demo data", error)
    return false
  }
}

export function clearData() {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage may be blocked; nothing else to clean up */
  }
}
