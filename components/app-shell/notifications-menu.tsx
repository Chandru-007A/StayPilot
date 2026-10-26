"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, CalendarDays, CreditCard, MessageSquare, SprayCan, Info, UtensilsCrossed } from "lucide-react"
import type { AppNotification, NotificationKind, NotificationPreferences } from "@/lib/types"
import { useHotelData } from "@/services/store"
import { clearNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/engagement-service"
import { formatRelative } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  booking: CalendarDays,
  payment: CreditCard,
  housekeeping: SprayCan,
  message: MessageSquare,
  food: UtensilsCrossed,
  system: Info,
}

const KIND_PREF: Record<NotificationKind, keyof NotificationPreferences | null> = {
  booking: "bookings",
  payment: "payments",
  housekeeping: "housekeeping",
  message: "messages",
  food: "food",
  system: null,
}

export function NotificationsMenu() {
  const data = useHotelData()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const prefs = data?.settings.notifications
  const items: AppNotification[] = (data?.notifications ?? []).filter((notification) => {
    const pref = KIND_PREF[notification.kind]
    return pref === null || !prefs || prefs[pref]
  })
  const unread = items.filter((notification) => !notification.read).length

  const openNotification = (notification: AppNotification) => {
    markNotificationRead(notification.id)
    setOpen(false)
    router.push(notification.href)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && prefs?.markReadOnOpen && unread > 0) markAllNotificationsRead()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllNotificationsRead()} disabled={unread === 0}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => clearNotifications()} disabled={items.length === 0}>
              Clear
            </Button>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={BellOff} title="You're all caught up" description="New bookings, payments and requests will appear here." />
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="flex flex-col">
              {items.map((notification) => {
                const Icon = KIND_ICON[notification.kind]
                return (
                  <li key={notification.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                        !notification.read && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{notification.title}</span>
                          {!notification.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </span>
                        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{notification.body}</span>
                        <span className="text-[11px] text-muted-foreground">{formatRelative(notification.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
