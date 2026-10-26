"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { findNavItem } from "@/lib/navigation"
import type { DemoSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "./global-search"
import { NotificationsMenu } from "./notifications-menu"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./user-menu"

export function AppHeader({ onOpenMobileNav, session }: { onOpenMobileNav: () => void; session: DemoSession }) {
  const pathname = usePathname()
  const current = findNavItem(pathname)

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu aria-hidden="true" />
      </Button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex items-center gap-2 text-sm">
          <li className="text-muted-foreground">StayPilot</li>
          <li className="text-muted-foreground" aria-hidden="true">
            /
          </li>
          <li className="truncate font-medium text-foreground" aria-current="page">
            {current?.label ?? "Dashboard"}
          </li>
        </ol>
      </nav>
      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <GlobalSearch />
        <span className="hidden rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning xl:inline">
          Demo data
        </span>
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu session={session} />
      </div>
    </header>
  )
}
