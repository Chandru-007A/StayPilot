"use client"

import { useSyncExternalStore } from "react"

/**
 * DEMO-ONLY session marker. It contains no password or token and grants no real access.
 * Production authentication must be issued and verified by the backend (e.g. an
 * HttpOnly session cookie set by the Express server).
 */
export interface DemoSession {
  name: string
  email: string
  signedInAt: string
  demo: true
}

const KEY = "staypilot.demo-session"
const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedSession: DemoSession | null = null

function readRaw() {
  try {
    return window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

function getSnapshot(): DemoSession | null {
  const raw = readRaw()
  if (raw === cachedRaw) return cachedSession
  cachedRaw = raw
  try {
    cachedSession = raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    cachedSession = null
  }
  return cachedSession
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

export function startDemoSession(email: string, name: string, remember: boolean) {
  const session: DemoSession = { email, name, signedInAt: new Date().toISOString(), demo: true }
  const target = remember ? window.localStorage : window.sessionStorage
  target.setItem(KEY, JSON.stringify(session))
  for (const listener of listeners) listener()
}

export function endDemoSession() {
  try {
    window.localStorage.removeItem(KEY)
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* storage blocked */
  }
  for (const listener of listeners) listener()
}

/** `undefined` while hydrating, then the session or null. */
export function useDemoSession(): DemoSession | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}
