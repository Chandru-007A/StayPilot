"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BedDouble, Filter, Plus, Search, Sparkles, Wrench, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { DataGate, PageSkeleton } from "@/components/shared/data-gate"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHotel } from "@/services/store"
import { setRoomHousekeeping, setRoomMaintenance } from "@/services/rooms-service"
import { roomStatus } from "@/lib/calculations"
import { todayString } from "@/lib/format"
import type { Room, RoomStatus } from "@/lib/types"
import { BookingDialog } from "@/components/bookings/booking-dialog"

export function RoomsView() {
  return (
    <DataGate>
      <Suspense fallback={<PageSkeleton />}>
        <RoomsContent />
      </Suspense>
    </DataGate>
  )
}

function RoomsContent() {
  const data = useHotel()
  const searchParams = useSearchParams()
  const today = todayString()

  const statusParam = searchParams.get("status") as RoomStatus | null

  const [query, setQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>(statusParam || "all")
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (statusParam && ["available", "occupied", "reserved", "cleaning", "maintenance"].includes(statusParam)) {
      setSelectedStatus(statusParam)
    }
  }, [statusParam])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase()

    return data.rooms.filter((room) => {
      const status = roomStatus(room, data.bookings, today)
      const matchesStatus = selectedStatus === "all" || status === selectedStatus
      const matchesQuery =
        !q ||
        room.number.toLowerCase().includes(q) ||
        room.type.toLowerCase().includes(q) ||
        `floor ${room.floor}`.includes(q)

      return matchesStatus && matchesQuery
    })
  }, [data.rooms, data.bookings, today, query, selectedStatus])

  return (
    <main className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Room inventory, real-time occupancy, and housekeeping maintenance."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              aria-label="Search rooms"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search room number, type, floor..."
              className="h-9 w-full rounded-md border bg-background pl-9 pr-8 text-sm"
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

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <SelectValue placeholder="Room status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved for arrival</SelectItem>
              <SelectItem value="cleaning">Needs cleaning</SelectItem>
              <SelectItem value="maintenance">Under maintenance</SelectItem>
            </SelectContent>
          </Select>

          {(query || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs"
              onClick={() => {
                setQuery("")
                setSelectedStatus("all")
              }}
            >
              Reset filters
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {filteredRooms.length} of {data.rooms.length} rooms
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms match your filter"
          description="Try selecting a different status or clearing your search query."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("")
                setSelectedStatus("all")
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => {
            const status = roomStatus(room, data.bookings, today)
            const activeBooking = data.bookings.find(
              (b) => b.roomId === room.id && (b.status === "checked_in" || (b.status === "confirmed" && b.checkIn <= today)),
            )
            const activeGuest = activeBooking ? data.guests.find((g) => g.id === activeBooking.guestId) : undefined

            return (
              <article key={room.id} className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="size-4 text-primary" />
                      <h2 className="font-semibold text-base text-foreground">Room {room.number}</h2>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {room.type} · Floor {room.floor} · Max {room.capacity} guests
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {activeGuest && (
                  <div className="mt-3 rounded-md bg-muted/30 p-2.5 text-xs">
                    <span className="text-muted-foreground">Current / Next guest:</span>
                    <p className="font-medium text-foreground mt-0.5">
                      {activeGuest.name}{" "}
                      <span className="text-muted-foreground font-mono font-normal">({activeBooking?.reference})</span>
                    </p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="font-medium">
                    ₹{room.pricePerNight.toLocaleString("en-IN")}{" "}
                    <span className="font-normal text-xs text-muted-foreground">/ night</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {status === "available" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setBookingRoom(room)}
                      >
                        <Plus className="mr-1 size-3" /> Book
                      </Button>
                    )}
                    <button
                      onClick={() => setRoomHousekeeping(room.id, room.housekeeping === "clean" ? "dirty" : "clean")}
                      className="rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted font-medium transition-colors"
                      title="Toggle Clean/Dirty state"
                    >
                      {room.housekeeping === "clean" ? "Mark dirty" : "Mark clean"}
                    </button>
                    <button
                      onClick={() =>
                        setRoomMaintenance(
                          room.id,
                          !room.maintenance,
                          room.maintenance ? "" : "Maintenance requested by staff",
                        )
                      }
                      aria-label={`Toggle maintenance for room ${room.number}`}
                      className={`rounded-md border p-1.5 hover:bg-muted transition-colors ${
                        room.maintenance ? "border-destructive text-destructive bg-destructive/10" : "text-muted-foreground"
                      }`}
                      title={room.maintenance ? "Remove maintenance lock" : "Place in maintenance"}
                    >
                      <Wrench className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Booking Dialog when booking directly from room card */}
      {bookingRoom && (
        <BookingDialog
          open={Boolean(bookingRoom)}
          onOpenChange={(open) => {
            if (!open) setBookingRoom(null)
          }}
          defaultRoomId={bookingRoom.id}
          onSuccess={() => setBookingRoom(null)}
        />
      )}
    </main>
  )
}
