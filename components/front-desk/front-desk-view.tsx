"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar, Edit, LogIn, LogOut, Search, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DataGate, PageSkeleton } from "@/components/shared/data-gate"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { useHotel } from "@/services/store"
import { useAction } from "@/hooks/use-action"
import { checkInBooking, checkOutBooking } from "@/services/bookings-service"
import { formatDate, todayString } from "@/lib/format"
import type { Booking, HotelData } from "@/lib/types"
import { BookingDialog } from "@/components/bookings/booking-dialog"
import { BookingDetailsSheet } from "@/components/bookings/booking-details-sheet"

export function FrontDeskView() {
  return (
    <DataGate>
      <Suspense fallback={<PageSkeleton />}>
        <FrontDeskContent />
      </Suspense>
    </DataGate>
  )
}

function FrontDeskContent() {
  const data = useHotel()
  const searchParams = useSearchParams()
  const { run, pending } = useAction()
  const today = todayString()

  const tabParam = searchParams.get("tab")
  const focusParam = searchParams.get("focus")

  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "departures" || tabParam === "in-house" ? "in-house" : "arrivals",
  )
  const [query, setQuery] = useState("")

  // Edit / View dialog states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (tabParam === "departures" || tabParam === "in-house") {
      setActiveTab("in-house")
    } else if (tabParam === "arrivals") {
      setActiveTab("arrivals")
    }

    if (focusParam) {
      setTimeout(() => {
        const el = document.getElementById(`desk-card-${focusParam}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 300)
    }
  }, [tabParam, focusParam])

  const arrivals = useMemo(() => {
    const list = data.bookings.filter((item) => item.status === "confirmed" || item.status === "pending")
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((b) => {
      const guest = data.guests.find((g) => g.id === b.guestId)
      const room = data.rooms.find((r) => r.id === b.roomId)
      return (
        b.reference.toLowerCase().includes(q) ||
        (guest?.name.toLowerCase() ?? "").includes(q) ||
        (room?.number.toLowerCase() ?? "").includes(q)
      )
    })
  }, [data.bookings, data.guests, data.rooms, query])

  const inHouse = useMemo(() => {
    const list = data.bookings.filter((item) => item.status === "checked_in")
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((b) => {
      const guest = data.guests.find((g) => g.id === b.guestId)
      const room = data.rooms.find((r) => r.id === b.roomId)
      return (
        b.reference.toLowerCase().includes(q) ||
        (guest?.name.toLowerCase() ?? "").includes(q) ||
        (room?.number.toLowerCase() ?? "").includes(q)
      )
    })
  }, [data.bookings, data.guests, data.rooms, query])

  async function handleCheckIn(booking: Booking) {
    if (booking.checkIn > today) {
      // Future arrival: prompt to edit stay dates first
      setEditingBooking(booking)
      return
    }
    await run(() => checkInBooking(booking.id), `Guest ${data.guests.find((g) => g.id === booking.guestId)?.name ?? ""} checked in`)
  }

  async function handleCheckOut(booking: Booking) {
    await run(() => checkOutBooking(booking.id), `Guest ${data.guests.find((g) => g.id === booking.guestId)?.name ?? ""} checked out`)
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Check-in / Check-out"
        description="Front office movements: manage daily arrivals, departures, and in-house guest services."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="arrivals">
              Arrivals <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{arrivals.length}</span>
            </TabsTrigger>
            <TabsTrigger value="in-house">
              In-house Guests <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{inHouse.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search guest or room..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {activeTab === "arrivals" && (
        <div className="space-y-3">
          {arrivals.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No pending arrivals"
              description="All expected arrivals for today have either checked in or no bookings match."
            />
          ) : (
            arrivals.map((booking) => (
              <DeskCard
                key={booking.id}
                booking={booking}
                data={data}
                today={today}
                isFocused={focusParam === booking.id}
                onView={() => setViewingBookingId(booking.id)}
                onEdit={() => setEditingBooking(booking)}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => setEditingBooking(booking)}
                    >
                      <Edit className="mr-1 size-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => handleCheckIn(booking)}
                      className="h-8 text-xs"
                    >
                      <LogIn className="mr-1.5 size-3.5" />
                      {booking.checkIn > today ? "Early check-in" : "Check in"}
                    </Button>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}

      {activeTab === "in-house" && (
        <div className="space-y-3">
          {inHouse.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="No in-house guests"
              description="No guests are currently checked in."
            />
          ) : (
            inHouse.map((booking) => (
              <DeskCard
                key={booking.id}
                booking={booking}
                data={data}
                today={today}
                isFocused={focusParam === booking.id}
                onView={() => setViewingBookingId(booking.id)}
                onEdit={() => setEditingBooking(booking)}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => setEditingBooking(booking)}
                    >
                      <Edit className="mr-1 size-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleCheckOut(booking)}
                      className="h-8 text-xs"
                    >
                      <LogOut className="mr-1.5 size-3.5" /> Check out
                    </Button>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}

      {/* Edit Booking Dialog */}
      {editingBooking && (
        <BookingDialog
          open={Boolean(editingBooking)}
          onOpenChange={(open) => {
            if (!open) setEditingBooking(null)
          }}
          booking={editingBooking}
          onSuccess={() => setEditingBooking(null)}
        />
      )}

      {/* View Booking Details Sheet */}
      <BookingDetailsSheet
        bookingId={viewingBookingId}
        open={Boolean(viewingBookingId)}
        onOpenChange={(open) => {
          if (!open) setViewingBookingId(null)
        }}
        onEdit={(b) => {
          setViewingBookingId(null)
          setEditingBooking(b)
        }}
      />
    </main>
  )
}

function DeskCard({
  booking,
  data,
  today,
  action,
  isFocused,
  onView,
  onEdit,
}: {
  booking: Booking
  data: HotelData
  today: string
  action: React.ReactNode
  isFocused?: boolean
  onView: () => void
  onEdit: () => void
}) {
  const guest = data.guests.find((item) => item.id === booking.guestId)
  const room = data.rooms.find((item) => item.id === booking.roomId)
  const isFuture = booking.checkIn > today && booking.status !== "checked_in"

  return (
    <Card
      id={`desk-card-${booking.id}`}
      className={`transition-all ${
        isFocused ? "ring-2 ring-primary shadow-md border-primary/50" : "hover:border-primary/30"
      }`}
    >
      <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onView}
              className="text-base font-semibold hover:underline text-left text-foreground"
            >
              {guest ? guest.name : "Unknown guest"}
            </button>
            {guest?.status === "vip" && <StatusBadge status="vip" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-mono text-primary font-medium">{booking.reference}</span> · Room{" "}
            {room?.number ?? "—"} ({room?.type ?? "Standard"}) · Floor {room?.floor}
          </p>
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 border-t pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5" />
            {booking.adults} adult{booking.adults === 1 ? "" : "s"}
            {booking.children ? ` · ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}
          </span>
          <span>
            Stay: <strong className="text-foreground">{formatDate(booking.checkIn)}</strong> →{" "}
            <strong className="text-foreground">{formatDate(booking.checkOut)}</strong>
          </span>
          {isFuture && (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              Arrival scheduled for {formatDate(booking.checkIn)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onView}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
