import { addDays, addHours, parseISO } from "date-fns"
import { activeBookingForRoom, bookingTotals, findRoomConflict, invoiceTotals } from "@/lib/calculations"
import { todayString, toDateString } from "@/lib/format"
import type { Booking, BookingSource, BookingStatus, HotelData, Invoice, PaymentMethod } from "@/lib/types"
import { readData, writeData } from "./store"
import { ServiceError, assert, nextSequence, pushNotification, simulateLatency, uid } from "./utils"

export interface BookingInput {
  guestId: string
  roomId: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  ratePerNight: number
  extraCharges: number
  taxRate: number
  specialRequests: string
  notes: string
  source: BookingSource
  status: Extract<BookingStatus, "pending" | "confirmed">
}

export interface InitialPayment {
  status: "unpaid" | "partial" | "paid"
  amount?: number
  method: PaymentMethod
}

function validateBooking(data: HotelData, input: BookingInput, excludeId?: string) {
  assert(data.guests.some((guest) => guest.id === input.guestId), "Select a guest for this reservation.")
  const room = data.rooms.find((item) => item.id === input.roomId)
  assert(room, "Select a valid room.")
  assert(input.checkOut > input.checkIn, "Check-out must be after check-in.")
  assert(input.adults >= 1, "At least one adult is required.")
  assert(input.adults + input.children <= room.capacity, `Room ${room.number} sleeps up to ${room.capacity} guests.`)
  const conflict = findRoomConflict(data.bookings, input.roomId, input.checkIn, input.checkOut, excludeId)
  if (conflict) {
    throw new ServiceError(
      `Room ${room.number} is already held by ${conflict.reference} (${conflict.checkIn} → ${conflict.checkOut}). Choose another room or dates.`,
    )
  }
  return room
}

/** Keeps the room/extras lines of an open folio in sync with the booking. */
function syncInvoiceLines(invoice: Invoice, booking: Booking, roomNumber: string, roomType: string) {
  if (invoice.finalized) return
  const totals = bookingTotals(booking)
  const others = invoice.lineItems.filter((line) => !line.id.endsWith("-room") && !line.id.endsWith("-extras"))
  const lines = [
    {
      id: `${invoice.id}-room`,
      description: `Room ${roomNumber} · ${roomType} (${totals.nights} night${totals.nights === 1 ? "" : "s"})`,
      quantity: totals.nights,
      unitPrice: booking.ratePerNight,
    },
  ]
  if (booking.extraCharges > 0) {
    lines.push({ id: `${invoice.id}-extras`, description: "Additional charges", quantity: 1, unitPrice: booking.extraCharges })
  }
  invoice.lineItems = [...lines, ...others]
  invoice.taxRate = booking.taxRate
  invoice.dueDate = booking.checkOut
}

export async function getBookings() {
  await simulateLatency(0)
  return readData().bookings
}

export async function createBooking(input: BookingInput, payment: InitialPayment) {
  await simulateLatency()
  let created: Booking | undefined
  writeData((draft) => {
    const room = validateBooking(draft, input)
    const sequence = nextSequence(draft.bookings.map((b) => b.reference), "SP-", 10001)
    const invoiceSeq = nextSequence(
      draft.invoices.map((inv) => inv.number.split("-").at(-1) ?? ""),
      "",
      1,
    )
    const booking: Booking = {
      ...input,
      id: uid("b"),
      reference: `SP-${sequence}`,
      invoiceId: null,
      createdAt: new Date().toISOString(),
      checkedInAt: null,
      checkedOutAt: null,
      cancelledAt: null,
    }
    const invoice: Invoice = {
      id: uid("inv"),
      number: `INV-${new Date().getFullYear()}-${String(invoiceSeq).padStart(4, "0")}`,
      guestId: booking.guestId,
      bookingId: booking.id,
      issueDate: todayString(),
      dueDate: booking.checkOut,
      lineItems: [],
      taxRate: booking.taxRate,
      payments: [],
      finalized: false,
      voided: false,
      notes: "",
    }
    syncInvoiceLines(invoice, booking, room.number, room.type)
    const { total } = invoiceTotals(invoice)
    const amount = payment.status === "paid" ? total : payment.status === "partial" ? (payment.amount ?? 0) : 0
    if (payment.status === "partial") {
      assert(amount > 0 && amount < total, "Deposit must be more than zero and less than the estimated total.")
    }
    if (amount > 0) {
      invoice.payments.push({ id: uid("p"), amount, method: payment.method, date: new Date().toISOString(), note: "Recorded at booking (simulated)" })
    }
    booking.invoiceId = invoice.id
    draft.bookings.push(booking)
    draft.invoices.push(invoice)
    pushNotification(draft, {
      kind: "booking",
      title: "Reservation created",
      body: `${booking.reference} · Room ${room.number}, ${booking.checkIn} → ${booking.checkOut}`,
      href: `/bookings?view=${booking.id}`,
    })
    created = booking
  })
  return created as Booking
}

export async function updateBooking(id: string, input: BookingInput) {
  await simulateLatency()
  writeData((draft) => {
    const booking = draft.bookings.find((item) => item.id === id)
    assert(booking, "Booking not found.")
    assert(booking.status !== "checked_out" && booking.status !== "cancelled", "Completed or cancelled bookings cannot be edited.")
    if (booking.status === "checked_in") {
      assert(input.roomId === booking.roomId, "Use a room move at the front desk for in-house guests.")
      assert(input.checkIn === booking.checkIn, "Arrival date cannot change after check-in.")
    }
    const room = validateBooking(draft, input, id)
    Object.assign(booking, input, { status: booking.status === "checked_in" ? "checked_in" : input.status })
    const invoice = draft.invoices.find((item) => item.id === booking.invoiceId)
    if (invoice) syncInvoiceLines(invoice, booking, room.number, room.type)
  })
}

export async function setBookingStatus(id: string, status: Extract<BookingStatus, "pending" | "confirmed">) {
  await simulateLatency()
  writeData((draft) => {
    const booking = draft.bookings.find((item) => item.id === id)
    assert(booking, "Booking not found.")
    assert(booking.status === "pending" || booking.status === "confirmed", "Only upcoming bookings can change between pending and confirmed.")
    booking.status = status
  })
}

export async function cancelBooking(id: string) {
  await simulateLatency()
  let note = ""
  writeData((draft) => {
    const booking = draft.bookings.find((item) => item.id === id)
    assert(booking, "Booking not found.")
    assert(booking.status === "pending" || booking.status === "confirmed", "Only bookings that have not checked in can be cancelled.")
    booking.status = "cancelled"
    booking.cancelledAt = new Date().toISOString()
    const invoice = draft.invoices.find((item) => item.id === booking.invoiceId)
    if (invoice) {
      if (invoice.payments.length === 0) invoice.voided = true
      else note = "A payment exists on this booking — handle the refund from Billing."
    }
  })
  return note
}

export async function checkInBooking(id: string, roomId?: string) {
  await simulateLatency()
  writeData((draft) => {
    const booking = draft.bookings.find((item) => item.id === id)
    assert(booking, "Reservation not found.")
    assert(booking.status === "confirmed" || booking.status === "pending", "This reservation is not awaiting arrival.")
    const today = todayString()
    assert(booking.checkIn <= today, "Arrival is in the future. Edit the reservation dates before checking in early.")
    assert(booking.checkOut > today, "This stay has already ended — edit the dates first.")
    const targetId = roomId ?? booking.roomId
    const room = draft.rooms.find((item) => item.id === targetId)
    assert(room, "Room not found.")
    assert(!activeBookingForRoom(room.id, draft.bookings), `Room ${room.number} is currently occupied.`)
    assert(!room.maintenance, `Room ${room.number} is out of service for maintenance.`)
    assert(room.housekeeping === "clean", `Room ${room.number} has not been cleaned yet.`)
    if (targetId !== booking.roomId) {
      const conflict = findRoomConflict(draft.bookings, targetId, today, booking.checkOut, booking.id)
      assert(!conflict, `Room ${room.number} is reserved by ${conflict?.reference} during this stay.`)
      booking.roomId = targetId
      const invoice = draft.invoices.find((item) => item.id === booking.invoiceId)
      if (invoice) syncInvoiceLines(invoice, booking, room.number, room.type)
    }
    booking.status = "checked_in"
    booking.checkedInAt = new Date().toISOString()
    pushNotification(draft, {
      kind: "booking",
      title: "Guest checked in",
      body: `${booking.reference} → Room ${room.number}`,
      href: "/check-in-out?tab=in-house",
    })
  })
}

export async function checkOutBooking(id: string) {
  await simulateLatency()
  writeData((draft) => {
    const booking = draft.bookings.find((item) => item.id === id)
    assert(booking, "Reservation not found.")
    assert(booking.status === "checked_in", "Only in-house guests can be checked out.")
    const today = todayString()
    const room = draft.rooms.find((item) => item.id === booking.roomId)
    if (today < booking.checkOut && today > booking.checkIn) booking.checkOut = today
    booking.status = "checked_out"
    booking.checkedOutAt = new Date().toISOString()
    const invoice = draft.invoices.find((item) => item.id === booking.invoiceId)
    if (invoice && !invoice.finalized) {
      if (room) syncInvoiceLines(invoice, booking, room.number, room.type)
      invoice.finalized = true
      invoice.issueDate = today
      invoice.dueDate = toDateString(addDays(parseISO(today), 7))
    }
    if (room) {
      room.housekeeping = "dirty"
      draft.tasks.unshift({
        id: uid("t"),
        roomId: room.id,
        category: "housekeeping",
        type: "Checkout clean",
        priority: "high",
        staffId: null,
        dueAt: addHours(new Date(), 2).toISOString(),
        status: "pending",
        notes: `Auto-created after ${booking.reference} checked out.`,
        completionNotes: "",
        blocksRoom: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      })
      pushNotification(draft, {
        kind: "housekeeping",
        title: "Room needs cleaning",
        body: `Room ${room.number} was vacated by ${booking.reference}.`,
        href: "/housekeeping",
      })
    }
  })
}
