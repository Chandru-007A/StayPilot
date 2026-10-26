"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarDays, CheckCircle2, Eye, Filter, Plus, Search, SlidersHorizontal, X, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataGate, PageSkeleton } from "@/components/shared/data-gate"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { SortHeader } from "@/components/shared/sort-header"
import { TablePagination } from "@/components/shared/table-pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useHotel } from "@/services/store"
import { useAction } from "@/hooks/use-action"
import { cancelBooking, setBookingStatus } from "@/services/bookings-service"
import { formatCurrency, formatDate, nightsBetween } from "@/lib/format"
import type { Booking } from "@/lib/types"
import { toast } from "sonner"
import { compareValues, usePagination, useSort } from "@/hooks/use-table-state"
import { BookingDialog } from "./booking-dialog"
import { BookingDetailsSheet } from "./booking-details-sheet"

type BookingSortKey = "reference" | "guest" | "room" | "checkIn" | "total" | "status"

export function BookingsView() {
  return (
    <DataGate>
      <Suspense fallback={<PageSkeleton />}>
        <BookingsContent />
      </Suspense>
    </DataGate>
  )
}

function BookingsContent() {
  const data = useHotel()
  const searchParams = useSearchParams()
  const { run, pending } = useAction()

  // Query and filter states
  const initialStatus = searchParams.get("status") || "all"
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState(initialStatus)

  // Dialog and sheet states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null)
  const [selectedBookingIdForView, setSelectedBookingIdForView] = useState<string | null>(null)
  const [viewSheetOpen, setViewSheetOpen] = useState(false)

  // Cancellation confirm dialog state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)

  // Sorting
  const { sortKey, direction, toggle: toggleSort } = useSort<BookingSortKey>("checkIn", "desc")

  // Deep linking: Handle ?new=1 or ?create=1 and ?view=ID
  useEffect(() => {
    if (searchParams.get("new") === "1" || searchParams.get("create") === "1") {
      setCreateDialogOpen(true)
    }

    const viewId = searchParams.get("view")
    if (viewId && data.bookings.some((b) => b.id === viewId)) {
      setSelectedBookingIdForView(viewId)
      setViewSheetOpen(true)
    }

    const statusParam = searchParams.get("status")
    if (statusParam && ["pending", "confirmed", "checked_in", "checked_out", "cancelled"].includes(statusParam)) {
      setStatus(statusParam)
    }
  }, [searchParams, data.bookings])

  // Filtered and sorted bookings
  const sortedAndFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = data.bookings.filter((booking) => {
      const guest = data.guests.find((item) => item.id === booking.guestId)
      const room = data.rooms.find((item) => item.id === booking.roomId)
      const matchesQuery =
        !q ||
        booking.reference.toLowerCase().includes(q) ||
        (guest?.name.toLowerCase() ?? "").includes(q) ||
        (guest?.phone ?? "").includes(q) ||
        (room?.number.toLowerCase() ?? "").includes(q)

      const matchesStatus = status === "all" || booking.status === status
      return matchesQuery && matchesStatus
    })

    return filtered.sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      if (sortKey === "reference") {
        aVal = a.reference
        bVal = b.reference
      } else if (sortKey === "guest") {
        aVal = data.guests.find((g) => g.id === a.guestId)?.name ?? ""
        bVal = data.guests.find((g) => g.id === b.guestId)?.name ?? ""
      } else if (sortKey === "room") {
        aVal = data.rooms.find((r) => r.id === a.roomId)?.number ?? ""
        bVal = data.rooms.find((r) => r.id === b.roomId)?.number ?? ""
      } else if (sortKey === "checkIn") {
        aVal = a.checkIn
        bVal = b.checkIn
      } else if (sortKey === "total") {
        aVal = a.ratePerNight * nightsBetween(a.checkIn, a.checkOut) + a.extraCharges
        bVal = b.ratePerNight * nightsBetween(b.checkIn, b.checkOut) + b.extraCharges
      } else if (sortKey === "status") {
        aVal = a.status
        bVal = b.status
      }

      return compareValues(aVal, bVal, direction)
    })
  }, [data.bookings, data.guests, data.rooms, query, status, sortKey, direction])

  // Pagination (15 items per page)
  const { page, pageCount, pageItems, total, pageSize, setPage } = usePagination(
    sortedAndFiltered,
    12,
    `${query}-${status}`,
  )

  const handleOpenView = (bookingId: string) => {
    setSelectedBookingIdForView(bookingId)
    setViewSheetOpen(true)
  }

  const handleOpenEdit = (booking: Booking) => {
    setSelectedBookingForEdit(booking)
  }

  const handleConfirmBooking = async (booking: Booking) => {
    await run(() => setBookingStatus(booking.id, "confirmed"), "Booking confirmed")
  }

  const handleExecuteCancel = async () => {
    if (!cancellingBooking) return true
    try {
      const note = await cancelBooking(cancellingBooking.id)
      toast.success(`Reservation ${cancellingBooking.reference} cancelled.`)
      if (note) toast.info(note)
      return true
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel reservation.")
      return false
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader title="Bookings" description="Manage reservations, check-in arrivals, and guest stays.">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1.5 size-4" /> New booking
        </Button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total reservations" value={data.bookings.length} icon={<CalendarDays className="size-5" />} />
        <Metric
          label="Confirmed arrivals"
          value={data.bookings.filter((item) => item.status === "confirmed").length}
          icon={<CheckCircle2 className="size-5" />}
        />
        <Metric
          label="Cancelled"
          value={data.bookings.filter((item) => item.status === "cancelled").length}
          icon={<XCircle className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Reservations</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {sortedAndFiltered.length} matching of {data.bookings.length} total stays
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-64 h-9 text-sm"
                placeholder="Search guest, ref, room..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending confirmation</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked in</SelectItem>
                <SelectItem value="checked_out">Checked out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {(query || status !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-xs"
                onClick={() => {
                  setQuery("")
                  setStatus("all")
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {sortedAndFiltered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No reservations found"
              description="No bookings match your current filter or search criteria."
              action={
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStatus("all") }}>
                  Clear search filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader
                      label="Reference"
                      sortKey="reference"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Guest"
                      sortKey="guest"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Room"
                      sortKey="room"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Stay Dates"
                      sortKey="checkIn"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    />
                    <SortHeader
                      label="Folio Total"
                      sortKey="total"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                      align="right"
                    />
                    <SortHeader
                      label="Status"
                      sortKey="status"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((booking) => {
                    const guest = data.guests.find((item) => item.id === booking.guestId)
                    const room = data.rooms.find((item) => item.id === booking.roomId)
                    const nights = nightsBetween(booking.checkIn, booking.checkOut)
                    const totalEstimate = booking.ratePerNight * nights + booking.extraCharges

                    return (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => handleOpenView(booking.id)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {booking.reference}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {guest ? guest.name : "Unknown guest"}
                            </span>
                            <span className="text-xs text-muted-foreground">{guest?.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {room ? (
                            <span className="text-sm font-medium">
                              Room {room.number}{" "}
                              <span className="text-xs font-normal text-muted-foreground">({room.type})</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div>
                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {nights} night{nights === 1 ? "" : "s"} · {booking.adults} adult
                            {booking.adults > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-sm">
                          {formatCurrency(totalEstimate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleOpenView(booking.id)}
                            >
                              <Eye className="mr-1 size-3.5" /> View
                            </Button>

                            {booking.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                disabled={pending}
                                onClick={() => handleConfirmBooking(booking)}
                              >
                                Confirm
                              </Button>
                            )}

                            {(booking.status === "pending" || booking.status === "confirmed") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                disabled={pending}
                                onClick={() => setCancellingBooking(booking)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Pagination */}
          <TablePagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            noun="reservations"
          />
        </CardContent>
      </Card>

      {/* New Booking Dialog */}
      <BookingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(created) => {
          setSelectedBookingIdForView(created.id)
          setViewSheetOpen(true)
        }}
      />

      {/* Edit Booking Dialog */}
      {selectedBookingForEdit && (
        <BookingDialog
          open={Boolean(selectedBookingForEdit)}
          onOpenChange={(open) => {
            if (!open) setSelectedBookingForEdit(null)
          }}
          booking={selectedBookingForEdit}
          onSuccess={(updated) => {
            setSelectedBookingForEdit(null)
            setSelectedBookingIdForView(updated.id)
            setViewSheetOpen(true)
          }}
        />
      )}

      {/* View Booking Details Sheet */}
      <BookingDetailsSheet
        bookingId={selectedBookingIdForView}
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        onEdit={(b) => handleOpenEdit(b)}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancellingBooking)}
        onOpenChange={(open) => {
          if (!open) setCancellingBooking(null)
        }}
        title="Cancel Reservation"
        description={
          cancellingBooking ? (
            <div>
              <p>
                Are you sure you want to cancel reservation <strong>{cancellingBooking.reference}</strong>?
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This will release Room{" "}
                {data.rooms.find((r) => r.id === cancellingBooking.roomId)?.number ?? ""} for other guests and update
                the folio status.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Cancel Reservation"
        destructive
        onConfirm={handleExecuteCancel}
      />
    </main>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</span>
      </CardContent>
    </Card>
  )
}
