"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDemoSession } from "@/lib/session"
import { useHotelData } from "@/services/store"
import { DataGate, PageSkeleton } from "@/components/shared/data-gate"
import { AppSidebar, MobileSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "staypilot.sidebar-collapsed"

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useDemoSession()
  const router = useRouter()
  const data = useHotelData()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (session === null) router.replace("/login")
  }, [session, router])

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {
      /* storage blocked */
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, current ? "0" : "1")
      } catch {
        /* storage blocked */
      }
      return !current
    })
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true">
        <p className="text-sm text-muted-foreground">{session === null ? "Redirecting to sign in…" : "Loading StayPilot…"}</p>
      </div>
    )
  }

  const compact = data?.settings.density === "compact"

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AppSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} session={session} />
        <main id="main-content" className={cn("flex-1 px-4 py-6 sm:px-6 lg:px-8", compact && "density-compact")}>
          <div className="mx-auto w-full max-w-7xl">
            <DataGate>
              <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
            </DataGate>
          </div>
        </main>
      </div>
    </div>
  )
}
