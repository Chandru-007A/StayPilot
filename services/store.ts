"use client"

import { useSyncExternalStore } from "react"
import { createSeedData } from "@/lib/mock-data"
import type { HotelData } from "@/lib/types"
import { STORAGE_KEY, clearData, loadData, saveData } from "./storage"

/**
 * In-memory cache of the demo dataset, mirrored to localStorage.
 * UI reads through `useHotel()`; all writes go through the service modules so the
 * data source can later be swapped for a REST API without touching components.
 */
let state: HotelData | null = null
let storageWarning: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function initialize(): HotelData {
  const result = loadData()
  if (result.ok) {
    state = result.data
    return state
  }
  state = createSeedData()
  if (result.reason === "corrupt") storageWarning = "Saved demo data was unreadable and has been re-initialised."
  if (result.reason === "outdated") storageWarning = "Demo data was upgraded to a newer format and re-initialised."
  if (result.reason === "unavailable") storageWarning = "Browser storage is unavailable — changes will not survive a refresh."
  saveData(state)
  return state
}

function getSnapshot(): HotelData | null {
  if (typeof window === "undefined") return null
  return state ?? initialize()
}

function getServerSnapshot(): HotelData | null {
  return null
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    const result = loadData()
    state = result.ok ? result.data : initialize()
    emit()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function readData(): HotelData {
  const current = getSnapshot()
  if (!current) throw new Error("Demo data is only available in the browser.")
  return current
}

export function writeData(updater: (draft: HotelData) => void) {
  const next = structuredClone(readData())
  updater(next)
  state = next
  if (!saveData(next)) storageWarning = "Changes could not be saved to browser storage."
  emit()
  return next
}

export function resetStore() {
  clearData()
  state = createSeedData()
  storageWarning = null
  saveData(state)
  emit()
}

export function consumeStorageWarning() {
  const warning = storageWarning
  storageWarning = null
  return warning
}

/** Returns null during server render and hydration, then the client dataset. */
export function useHotelData() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** For components rendered inside `<DataGate>`, where data is guaranteed to exist. */
export function useHotel(): HotelData {
  const data = useHotelData()
  if (!data) throw new Error("useHotel must be used inside <DataGate>.")
  return data
}
