"use client"

import { useEffect, useMemo, useState } from "react"
import { addDays, parseISO } from "date-fns"
import { AlertCircle, CalendarCheck, Check, Info, Loader2, Plus, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { bookingTotals, findRoomConflict } from "@/lib/calculations"
import { formatCurrency, nightsBetween, toDateString, todayString } from "@/lib/format"
import type { Booking, BookingSource, BookingStatus, PaymentMethod, Room } from "@/lib/types"
import { useHotel } from "@/services/store"
import { createBooking, updateBooking, type BookingInput, type InitialPayment } from "@/services/bookings-service"
import { createGuest } from "@/services/guests-service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: Booking | null
  defaultRoomId?: string
  defaultCheckIn?: string
  defaultCheckOut?: string
  onSuccess?: (booking: Booking) => void
}

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  defaultRoomId,
  defaultCheckIn,
  defaultCheckOut,
  onSuccess,
}: BookingDialogProps) {
  const data = useHotel()
  const isEdit = Boolean(booking)

  // Default dates: today and tomorrow
  const today = todayString()
  const tomorrow = toDateString(addDays(parseISO(today), 1))

  // Form states
  const [guestId, setGuestId] = useState("")
  const [isNewGuest, setIsNewGuest] = useState(false)
  const [newGuestName, setNewGuestName] = useState("")
  const [newGuestPhone, setNewGuestPhone] = useState("")
  const [newGuestEmail, setNewGuestEmail] = useState("")
  const [newGuestCity, setNewGuestCity] = useState("Mumbai")

  const [checkIn, setCheckIn] = useState(defaultCheckIn || today)
  const [checkOut, setCheckOut] = useState(defaultCheckOut || tomorrow)
  const [roomId, setRoomId] = useState(defaultRoomId || "")
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [ratePerNight, setRatePerNight] = useState<number>(0)
  const [extraCharges, setExtraCharges] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(12)
  const [source, setSource] = useState<BookingSource>("Direct")
  const [status, setStatus] = useState<Extract<BookingStatus, "pending" | "confirmed">>("confirmed")
  const [specialRequests, setSpecialRequests] = useState("")
  const [notes, setNotes] = useState("")

  // Payment states (create mode only)
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "partial" | "paid">("unpaid")
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  const [submitting, setSubmitting] = useState(false)

  // Populate form on edit or open
  useEffect(() => {
    if (booking) {
      setGuestId(booking.guestId)
      setIsNewGuest(false)
      setCheckIn(booking.checkIn)
      setCheckOut(booking.checkOut)
      setRoomId(booking.roomId)
      setAdults(booking.adults)
      setChildren(booking.children)
      setRatePerNight(booking.ratePerNight)
      setExtraCharges(booking.extraCharges)
      setTaxRate(booking.taxRate)
      setSource(booking.source)
      setStatus(booking.status === "pending" ? "pending" : "confirmed")
      setSpecialRequests(booking.specialRequests || "")
      setNotes(booking.notes || "")
    } else {
      setGuestId(data.guests[0]?.id || "")
      setIsNewGuest(false)
      setNewGuestName("")
      setNewGuestPhone("")
      setNewGuestEmail("")
      setNewGuestCity("Mumbai")
      const inDate = defaultCheckIn || today
      const outDate = defaultCheckOut || toDateString(addDays(parseISO(inDate), 1))
      setCheckIn(inDate)
      setCheckOut(outDate)
      const selectedRoom = (defaultRoomId && data.rooms.find((r) => r.id === defaultRoomId)) || data.rooms[0]
      if (selectedRoom) {
        setRoomId(selectedRoom.id)
        setRatePerNight(selectedRoom.pricePerNight)
      }
      setAdults(1)
      setChildren(0)
      setExtraCharges(0)
      setTaxRate(12)
      setSource("Direct")
      setStatus("confirmed")
      setPaymentStatus("unpaid")
      setDepositAmount(0)
      setPaymentMethod("card")
      setSpecialRequests("")
      setNotes("")
    }
  }, [booking, open, defaultRoomId, defaultCheckIn, defaultCheckOut, data.rooms, data.guests, today])

  // Update room rate automatically when room changes if rate wasn't custom
  const handleRoomChange = (newRoomId: string) => {
    setRoomId(newRoomId)
    const room = data.rooms.find((r) => r.id === newRoomId)
    if (room) {
      setRatePerNight(room.pricePerNight)
    }
  }

  // Selected room object
  const selectedRoom = useMemo(() => data.rooms.find((r) => r.id === roomId), [data.rooms, roomId])

  // Room conflict check for the selected room
  const conflict = useMemo(() => {
    if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) return undefined
    return findRoomConflict(data.bookings, roomId, checkIn, checkOut, booking?.id)
  }, [data.bookings, roomId, checkIn, checkOut, booking?.id])

  // Real-time capacity check
  const totalGuests = adults + children
  const capacityExceeded = selectedRoom ? totalGuests > selectedRoom.capacity : false

  // Date validity
  const validDates = checkIn && checkOut && checkOut > checkIn
  const nights = validDates ? nightsBetween(checkIn, checkOut) : 0

  // Real-time calculation
  const calculations = useMemo(() => {
    if (!validDates) return { roomCharge: 0, subtotal: 0, tax: 0, total: 0 }
    return bookingTotals({
      checkIn,
      checkOut,
      ratePerNight: ratePerNight || 0,
      extraCharges: extraCharges || 0,
      taxRate: taxRate || 0,
    })
  }, [validDates, checkIn, checkOut, ratePerNight, extraCharges, taxRate])

  // Room availability list for the dropdown
  const roomsWithAvailability = useMemo(() => {
    if (!validDates) return data.rooms.map((room) => ({ ...room, conflict: undefined }))
    return data.rooms.map((room) => {
      const roomConflict = findRoomConflict(data.bookings, room.id, checkIn, checkOut, booking?.id)
      return { ...room, conflict: roomConflict }
    })
  }, [data.rooms, data.bookings, validDates, checkIn, checkOut, booking?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validDates) {
      toast.error("Check-out date must be after check-in date.")
      return
    }

    if (adults < 1) {
      toast.error("At least one adult is required.")
      return
    }

    if (capacityExceeded && selectedRoom) {
      toast.error(`Room ${selectedRoom.number} capacity is ${selectedRoom.capacity} guests. Selected: ${totalGuests}.`)
      return
    }

    if (conflict && selectedRoom) {
      toast.error(`Room ${selectedRoom.number} is unavailable for these dates (${conflict.reference}).`)
      return
    }

    setSubmitting(true)
    try {
      let finalGuestId = guestId

      // Create new guest if toggled
      if (!isEdit && isNewGuest) {
        if (!newGuestName.trim()) {
          toast.error("Guest name is required.")
          setSubmitting(false)
          return
        }
        if (!newGuestEmail.trim() || !newGuestEmail.includes("@")) {
          toast.error("Valid guest email is required.")
          setSubmitting(false)
          return
        }
        if (!newGuestPhone.trim()) {
          toast.error("Guest phone number is required.")
          setSubmitting(false)
          return
        }
        const createdGuest = await createGuest({
          name: newGuestName.trim(),
          email: newGuestEmail.trim().toLowerCase(),
          phone: newGuestPhone.trim(),
          city: newGuestCity.trim() || "Mumbai",
          status: "regular",
          preferences: "",
          notes: "",
        })
        finalGuestId = createdGuest.id
      }

      const input: BookingInput = {
        guestId: finalGuestId,
        roomId,
        checkIn,
        checkOut,
        adults,
        children,
        ratePerNight,
        extraCharges,
        taxRate,
        specialRequests: specialRequests.trim(),
        notes: notes.trim(),
        source,
        status,
      }

      if (isEdit && booking) {
        await updateBooking(booking.id, input)
        toast.success(`Reservation ${booking.reference} updated successfully.`)
        onOpenChange(false)
        onSuccess?.({ ...booking, ...input })
      } else {
        const paymentInput: InitialPayment = {
          status: paymentStatus,
          amount: paymentStatus === "partial" ? depositAmount : undefined,
          method: paymentMethod,
        }
        const created = await createBooking(input, paymentInput)
        toast.success(`Reservation ${created.reference} created successfully.`)
        onOpenChange(false)
        onSuccess?.(created)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save reservation."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Reservation · ${booking?.reference}` : "New Reservation"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modify stay dates, room assignment, rates, and guest notes."
              : "Book a room, check real-time availability, and create a folio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Guest Selection */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Guest information</Label>
              {!isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNewGuest(!isNewGuest)}
                  className="h-7 text-xs text-primary"
                >
                  {isNewGuest ? (
                    <>
                      <Users className="mr-1 size-3.5" /> Choose existing
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1 size-3.5" /> Add new guest
                    </>
                  )}
                </Button>
              )}
            </div>

            {isEdit ? (
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {data.guests.find((g) => g.id === guestId)?.name.charAt(0) || "G"}
                </div>
                <div>
                  <p className="text-sm font-medium">{data.guests.find((g) => g.id === guestId)?.name}</p>
                  <p className="text-xs text-muted-foreground">{data.guests.find((g) => g.id === guestId)?.email}</p>
                </div>
              </div>
            ) : isNewGuest ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="new-name" className="text-xs">
                    Full name *
                  </Label>
                  <Input
                    id="new-name"
                    placeholder="e.g. Priya Sharma"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-email" className="text-xs">
                    Email address *
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="priya@example.com"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-phone" className="text-xs">
                    Phone number *
                  </Label>
                  <Input
                    id="new-phone"
                    placeholder="+91 98765 43210"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-city" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="new-city"
                    placeholder="e.g. Bengaluru"
                    value={newGuestCity}
                    onChange={(e) => setNewGuestCity(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select value={guestId} onValueChange={setGuestId}>
                  <SelectTrigger id="guest-select" className="w-full">
                    <SelectValue placeholder="Select guest" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {data.guests.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} · {g.phone} ({g.city}) {g.status === "vip" ? "★ VIP" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dates & Stay */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="check-in">Check-in date</Label>
              <Input
                id="check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                disabled={isEdit && booking?.status === "checked_in"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="check-out">Check-out date</Label>
              <Input
                id="check-out"
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                <CalendarCheck className="mr-2 size-4 text-primary" />
                <span className="font-medium">
                  {nights} night{nights === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Room Selection with Availability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="room-select">Room assignment</Label>
              {selectedRoom && (
                <span className="text-xs text-muted-foreground">
                  Floor {selectedRoom.floor} · Max capacity: {selectedRoom.capacity} guests
                </span>
              )}
            </div>
            <Select value={roomId} onValueChange={handleRoomChange}>
              <SelectTrigger id="room-select" className="w-full">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {roomsWithAvailability.map((r) => {
                  const isAvailable = !r.conflict
                  return (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">Room {r.number}</span>
                        <span className="text-muted-foreground">({r.type})</span>
                        <span>· ₹{r.pricePerNight.toLocaleString("en-IN")}/night</span>
                        {isAvailable ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Booked ({r.conflict?.reference})
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Conflict Alert Warning */}
            {conflict && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">Room conflict detected</p>
                  <p>
                    Room {selectedRoom?.number} is already booked by reservation <strong>{conflict.reference}</strong> (
                    {conflict.checkIn} → {conflict.checkOut}). Please select a different room or change stay dates.
                  </p>
                </div>
              </div>
            )}

            {/* Capacity Warning */}
            {capacityExceeded && selectedRoom && (
              <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">Capacity warning</p>
                  <p>
                    Room {selectedRoom.number} sleeps up to {selectedRoom.capacity} guests, but you have selected{" "}
                    {totalGuests} guests ({adults} adult{adults > 1 ? "s" : ""}, {children} child{children !== 1 ? "ren" : ""}).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Occupancy and Rates */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="adults">Adults (18+)</Label>
              <Input
                id="adults"
                type="number"
                min={1}
                max={8}
                value={adults}
                onChange={(e) => setAdults(Number.parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min={0}
                max={6}
                value={children}
                onChange={(e) => setChildren(Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">Rate / night (₹)</Label>
              <Input
                id="rate"
                type="number"
                min={100}
                value={ratePerNight}
                onChange={(e) => setRatePerNight(Number.parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="extras">Extra charges (₹)</Label>
              <Input
                id="extras"
                type="number"
                min={0}
                value={extraCharges}
                onChange={(e) => setExtraCharges(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Source & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="source">Booking channel</Label>
              <Select value={source} onValueChange={(v) => setSource(v as BookingSource)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct / Hotel desk</SelectItem>
                  <SelectItem value="Website">Official website</SelectItem>
                  <SelectItem value="Phone">Phone call</SelectItem>
                  <SelectItem value="Travel agent">Travel agent</SelectItem>
                  <SelectItem value="Walk-in">Walk-in guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Reservation status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Extract<BookingStatus, "pending" | "confirmed">)}
                disabled={isEdit && booking?.status === "checked_in"}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment (Initial recording on creation) */}
          {!isEdit && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <Label className="text-sm font-semibold">Payment / Deposit at booking</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="payment-status" className="text-xs">
                    Payment status
                  </Label>
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as "unpaid" | "partial" | "paid")}>
                    <SelectTrigger id="payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid / Pay on arrival</SelectItem>
                      <SelectItem value="partial">Partial advance deposit</SelectItem>
                      <SelectItem value="paid">Paid in full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentStatus === "partial" && (
                  <div className="space-y-1">
                    <Label htmlFor="deposit-amount" className="text-xs">
                      Deposit amount (₹)
                    </Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      min={1}
                      max={calculations.total - 1}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number.parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                )}
                {paymentStatus !== "unpaid" && (
                  <div className="space-y-1">
                    <Label htmlFor="payment-method" className="text-xs">
                      Payment method
                    </Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger id="payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit / Debit Card</SelectItem>
                        <SelectItem value="upi">UPI (GPay / PhonePe / Paytm)</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Requests & Notes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="requests">Special requests (from guest)</Label>
              <Textarea
                id="requests"
                placeholder="e.g. High floor, extra pillows, early check-in requested..."
                className="h-20 resize-none text-xs"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal notes (staff only)</Label>
              <Textarea
                id="notes"
                placeholder="Internal front office remarks..."
                className="h-20 resize-none text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Live Billing Summary Footer */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
              <span>
                Room charge: {formatCurrency(calculations.roomCharge)} ({nights} nights × {formatCurrency(ratePerNight)})
              </span>
              <span>Extra services: {formatCurrency(extraCharges)}</span>
              <span>GST (12%): {formatCurrency(calculations.tax)}</span>
            </div>
            <Separator className="my-2.5" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Estimated Total Folio</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {formatCurrency(calculations.total)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || Boolean(conflict) || capacityExceeded || !validDates}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Confirm Reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
