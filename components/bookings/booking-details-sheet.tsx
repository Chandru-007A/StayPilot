"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  ExternalLink,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Receipt,
  User,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { bookingTotals, invoiceTotals, paymentStatusForBooking } from "@/lib/calculations"
import { formatCurrency, formatDate, formatDateTime, nightsBetween } from "@/lib/format"
import type { Booking } from "@/lib/types"
import { useHotel } from "@/services/store"
import { cancelBooking, checkInBooking, checkOutBooking, setBookingStatus } from "@/services/bookings-service"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface BookingDetailsSheetProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (booking: Booking) => void
}

export function BookingDetailsSheet({
  bookingId,
  open,
  onOpenChange,
  onEdit,
}: BookingDetailsSheetProps) {
  const data = useHotel()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const booking = data.bookings.find((b) => b.id === bookingId)
  const guest = booking ? data.guests.find((g) => g.id === booking.guestId) : undefined
  const room = booking ? data.rooms.find((r) => r.id === booking.roomId) : undefined
  const invoice = booking && booking.invoiceId ? data.invoices.find((i) => i.id === booking.invoiceId) : undefined

  if (!booking) {
    return null
  }

  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const totals = bookingTotals(booking)
  const invTotals = invoice ? invoiceTotals(invoice) : null
  const paymentStatus = paymentStatusForBooking(booking, data.invoices)

  const handleConfirm = async () => {
    setProcessing(true)
    try {
      await setBookingStatus(booking.id, "confirmed")
      toast.success(`Reservation ${booking.reference} confirmed.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm reservation.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCheckIn = async () => {
    setProcessing(true)
    try {
      await checkInBooking(booking.id)
      toast.success(`Guest checked in to Room ${room?.number || ""}.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Check-in failed.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCheckOut = async () => {
    setProcessing(true)
    try {
      await checkOutBooking(booking.id)
      toast.success(`Guest checked out. Room ${room?.number || ""} marked for cleaning.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Check-out failed.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    try {
      const note = await cancelBooking(booking.id)
      toast.success(`Reservation ${booking.reference} cancelled.`)
      if (note) toast.info(note)
      return true
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel reservation.")
      return false
    }
  }

  const canEdit = booking.status !== "checked_out" && booking.status !== "cancelled"
  const canCancel = booking.status === "pending" || booking.status === "confirmed"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="text-left space-y-2 border-b pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold font-mono tracking-tight text-primary">
                {booking.reference}
              </SheetTitle>
              <StatusBadge status={booking.status} />
            </div>
            <SheetDescription className="flex items-center gap-2 text-xs">
              <span>Booked on {formatDate(booking.createdAt)}</span>
              <span>·</span>
              <span className="font-medium text-foreground">{booking.source} channel</span>
            </SheetDescription>
          </SheetHeader>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2 py-4 border-b">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(booking)
                }}
              >
                <Edit className="mr-1.5 size-3.5" /> Edit
              </Button>
            )}

            {booking.status === "pending" && (
              <Button size="sm" onClick={handleConfirm} disabled={processing}>
                <CheckCircle2 className="mr-1.5 size-3.5" /> Confirm
              </Button>
            )}

            {booking.status === "confirmed" && (
              <Button size="sm" onClick={handleCheckIn} disabled={processing}>
                <LogIn className="mr-1.5 size-3.5" /> Check in
              </Button>
            )}

            {booking.status === "checked_in" && (
              <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={processing}>
                <LogOut className="mr-1.5 size-3.5" /> Check out
              </Button>
            )}

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setCancelOpen(true)}
                disabled={processing}
              >
                <XCircle className="mr-1.5 size-3.5" /> Cancel booking
              </Button>
            )}
          </div>

          <div className="space-y-6 py-5">
            {/* Guest Details */}
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5" /> Guest details
                </span>
                {guest?.status === "vip" && <StatusBadge status="vip" />}
              </div>
              <div>
                <p className="text-base font-semibold">{guest?.name || "Unknown guest"}</p>
                <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3 text-muted-foreground/70" /> {guest?.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3 text-muted-foreground/70" /> {guest?.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-muted-foreground/70" /> {guest?.city}
                  </span>
                </div>
                {guest?.preferences && (
                  <p className="mt-2 text-xs bg-muted/50 p-2 rounded text-muted-foreground">
                    <strong>Guest preference:</strong> {guest.preferences}
                  </p>
                )}
              </div>
            </div>

            {/* Room & Stay Details */}
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BedDouble className="size-3.5" /> Stay & Room details
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border bg-muted/20 p-2.5">
                  <p className="text-xs text-muted-foreground">Assigned Room</p>
                  <p className="text-sm font-semibold mt-0.5">
                    Room {room?.number ?? "—"} ({room?.type ?? "Standard"})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Floor {room?.floor} · Max capacity: {room?.capacity} guests
                  </p>
                </div>
                <div className="rounded-md border bg-muted/20 p-2.5">
                  <p className="text-xs text-muted-foreground">Guests</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {booking.adults} adult{booking.adults > 1 ? "s" : ""}
                    {booking.children ? ` · ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rate: {formatCurrency(booking.ratePerNight)} / night
                  </p>
                </div>
              </div>

              <div className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="text-sm font-semibold mt-0.5">{formatDate(booking.checkIn)}</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {nights} night{nights === 1 ? "" : "s"}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground mt-1" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="text-sm font-semibold mt-0.5">{formatDate(booking.checkOut)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Folio */}
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="size-3.5" /> Folio & Billing
                </span>
                <StatusBadge status={paymentStatus} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Room charges ({nights} night{nights > 1 ? "s" : ""} × {formatCurrency(booking.ratePerNight)}):
                  </span>
                  <span className="font-medium">{formatCurrency(totals.roomCharge)}</span>
                </div>
                {booking.extraCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extra services & amenities:</span>
                    <span className="font-medium">{formatCurrency(booking.extraCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({booking.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">{formatCurrency(totals.total)}</span>
                </div>
                {invTotals && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Total Paid:</span>
                      <span className="font-medium text-foreground">{formatCurrency(invTotals.paid)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Outstanding Balance:</span>
                      <span className={`font-semibold ${invTotals.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {formatCurrency(invTotals.balance)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {invoice && (
                <div className="pt-2 border-t mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">Invoice #{invoice.number}</span>
                  <Button variant="link" size="sm" asChild className="h-6 p-0 text-primary">
                    <Link href={`/billing?view=${invoice.id}`}>
                      View Folio in Billing <ExternalLink className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Special Requests & Notes */}
            {(booking.specialRequests || booking.notes) && (
              <div className="space-y-2 rounded-lg border bg-card p-4 text-xs">
                {booking.specialRequests && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Special Requests:</span>
                    <p className="mt-0.5 text-foreground">{booking.specialRequests}</p>
                  </div>
                )}
                {booking.specialRequests && booking.notes && <Separator />}
                {booking.notes && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Internal Notes:</span>
                    <p className="mt-0.5 text-foreground">{booking.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-1 text-[11px] text-muted-foreground border-t pt-3">
              <p>Created: {formatDateTime(booking.createdAt)}</p>
              {booking.checkedInAt && <p>Checked in: {formatDateTime(booking.checkedInAt)}</p>}
              {booking.checkedOutAt && <p>Checked out: {formatDateTime(booking.checkedOutAt)}</p>}
              {booking.cancelledAt && <p className="text-destructive">Cancelled: {formatDateTime(booking.cancelledAt)}</p>}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Reservation"
        description={
          <div>
            <p>
              Are you sure you want to cancel reservation <strong>{booking.reference}</strong> for {guest?.name}?
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              If an invoice has recorded advance payments, it will be marked for refund handling in Billing.
            </p>
          </div>
        }
        confirmLabel="Cancel Reservation"
        destructive
        onConfirm={handleCancel}
      />
    </>
  )
}
