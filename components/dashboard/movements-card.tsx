"use client"

import Link from "next/link"
import { CalendarCheck, CalendarX } from "lucide-react"
import type { Booking } from "@/lib/types"
import { useHotel } from "@/services/store"
import { initials } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"

interface MovementsCardProps {
  arrivals: Booking[]
  departures: Booking[]
  className?: string
}

function MovementList({ bookings, kind }: { bookings: Booking[]; kind: "arrival" | "departure" }) {
  const data = useHotel()
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={kind === "arrival" ? CalendarCheck : CalendarX}
        title={kind === "arrival" ? "No arrivals pending" : "No departures due"}
        description={kind === "arrival" ? "Everyone expected today has checked in." : "No in-house guests are due to leave."}
        className="py-8"
      />
    )
  }
  return (
    <ul className="flex flex-col divide-y">
      {bookings.slice(0, 5).map((booking) => {
        const guest = data.guests.find((item) => item.id === booking.guestId)
        const room = data.rooms.find((item) => item.id === booking.roomId)
        return (
          <li key={booking.id} className="flex items-center gap-3 py-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-muted text-xs">{initials(guest?.name ?? "?")}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{guest?.name ?? "Unknown guest"}</span>
                {guest?.status === "vip" && <StatusBadge status="vip" />}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Room {room?.number ?? "—"} · {booking.reference}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/check-in-out?tab=${kind === "arrival" ? "arrivals" : "departures"}&focus=${booking.id}`}>
                {kind === "arrival" ? "Check in" : "Check out"}
              </Link>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export function MovementsCard({ arrivals, departures, className }: MovementsCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Front desk queue</CardTitle>
          <CardDescription>Guests waiting on you today</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/check-in-out">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="arrivals-heading" className="flex flex-col">
          <h3 id="arrivals-heading" className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Arrivals
            <span className="tabular-nums">{arrivals.length}</span>
          </h3>
          <MovementList bookings={arrivals} kind="arrival" />
        </section>
        <section aria-labelledby="departures-heading" className="flex flex-col">
          <h3 id="departures-heading" className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Departures
            <span className="tabular-nums">{departures.length}</span>
          </h3>
          <MovementList bookings={departures} kind="departure" />
        </section>
      </CardContent>
    </Card>
  )
}
