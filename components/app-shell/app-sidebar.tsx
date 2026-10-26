"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Hotel, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { NAV_GROUPS, type NavItem } from "@/lib/navigation"
import { useHotelData } from "@/services/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

function useBadgeCounts() {
  const data = useHotelData()
  if (!data) return { messages: 0, orders: 0 }
  return {
    messages: data.conversations.filter((conversation) => conversation.unread && !conversation.archived).length,
    orders: data.orders.filter((order) => order.status === "new").length,
  }
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Hotel className="size-4" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">StayPilot</span>
          <span className="text-xs text-muted-foreground">Hotel management</span>
        </span>
      )}
    </Link>
  )
}

function NavLink({ item, collapsed, count, onNavigate }: { item: NavItem; collapsed: boolean; count: number; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {count > 0 &&
        (collapsed ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-label={`${count} new`} />
        ) : (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground tabular-nums">
            {count}
            <span className="sr-only"> new</span>
          </span>
        ))}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {count > 0 && ` (${count})`}
      </TooltipContent>
    </Tooltip>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const counts = useBadgeCounts()
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            <div className="mx-3 mb-1 h-px bg-border" aria-hidden="true" />
          ) : (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">{group.label}</p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              count={item.badge ? counts[item.badge] : 0}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

export function AppSidebar({ collapsed, onToggleCollapsed }: { collapsed: boolean; onToggleCollapsed: () => void }) {
  return (
    <aside
      className={cn(
        "no-print sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "px-4")}>
        <Brand collapsed={collapsed} />
      </div>
      <ScrollArea className="flex-1">
        <div className={cn("py-4", collapsed ? "px-2" : "px-3")}>
          <NavList collapsed={collapsed} />
        </div>
      </ScrollArea>
      <div className={cn("flex flex-col gap-3 border-t p-3", collapsed && "items-center")}>
        {!collapsed && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Demo mode. Data is stored only in this browser.
          </p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggleCollapsed}
          className={cn(!collapsed && "justify-start")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </aside>
  )
}

export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
        <SheetHeader className="h-16 justify-center border-b px-4 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation for StayPilot</SheetDescription>
          <Brand />
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="px-3 py-4">
            <NavList collapsed={false} onNavigate={() => onOpenChange(false)} />
          </div>
        </ScrollArea>
        <p className="m-3 rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Demo mode. Data is stored only in this browser.
        </p>
      </SheetContent>
    </Sheet>
  )
}
