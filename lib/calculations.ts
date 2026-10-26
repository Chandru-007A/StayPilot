import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import { nightsBetween, toDateString } from "./format"
import type {
  Booking,
  DateString,
  FoodOrder,
  HotelData,
  HousekeepingTask,
  Invoice,
  InvoiceStatus,
  PaymentStatus,
  Review,
  Room,
  RoomStatus,
} from "./types"

const round2 = (value: number) => Math.round(value * 100) / 100

/* ---------- Bookings ---------- */

export function bookingTotals(input: Pick<Booking, "checkIn" | "checkOut" | "ratePerNight" | "extraCharges" | "taxRate">) {
  const nights = nightsBetween(input.checkIn, input.checkOut)
  const roomCharge = nights * (input.ratePerNight || 0)
  const subtotal = roomCharge + (input.extraCharges || 0)
  const tax = round2((subtotal * (input.taxRate || 0)) / 100)
  return { nights, roomCharge, subtotal, tax, total: round2(subtotal + tax) }
}

/** Bookings that occupy (or will occupy) a room. Cancelled and completed stays never block a room. */
export function isBlockingBooking(booking: Booking) {
  return booking.status === "pending" || booking.status === "confirmed" || booking.status === "checked_in"
}

export function rangesOverlap(aStart: DateString, aEnd: DateString, bStart: DateString, bEnd: DateString) {
  return aStart < bEnd && bStart < aEnd
}

export function findRoomConflict(
  bookings: Booking[],
  roomId: string,
  checkIn: DateString,
  checkOut: DateString,
  excludeBookingId?: string,
) {
  return bookings.find(
    (booking) =>
      booking.id !== excludeBookingId &&
      booking.roomId === roomId &&
      isBlockingBooking(booking) &&
      rangesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut),
  )
}

export function paymentStatusForBooking(booking: Booking, invoices: Invoice[]): PaymentStatus {
  const invoice = invoices.find((item) => item.id === booking.invoiceId)
  if (!invoice || invoice.voided) return "no_invoice"
  const { total, paid } = invoiceTotals(invoice)
  if (total > 0 && paid >= total) return "paid"
  if (paid > 0) return "partial"
  return "unpaid"
}

/* ---------- Invoices ---------- */

export function invoiceTotals(invoice: Pick<Invoice, "lineItems" | "taxRate" | "payments">) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = round2((subtotal * (invoice.taxRate || 0)) / 100)
  const total = round2(subtotal + tax)
  const paid = round2(invoice.payments.reduce((sum, payment) => sum + payment.amount, 0))
  return { subtotal: round2(subtotal), tax, total, paid, balance: round2(Math.max(0, total - paid)) }
}

export function invoiceStatus(invoice: Invoice, today: DateString): InvoiceStatus {
  if (invoice.voided) return "void"
  const { total, paid } = invoiceTotals(invoice)
  if (total > 0 && paid >= total) return "paid"
  if (!invoice.finalized) return paid > 0 ? "partial" : "draft"
  if (invoice.dueDate < today) return "overdue"
  return paid > 0 ? "partial" : "unpaid"
}

/** Balance that is due from guests: finalized, non-void invoices with money still owed. */
export function outstandingInvoices(invoices: Invoice[]) {
  return invoices.filter((invoice) => invoice.finalized && !invoice.voided && invoiceTotals(invoice).balance > 0)
}

/* ---------- Rooms ---------- */

export function activeBookingForRoom(roomId: string, bookings: Booking[]) {
  return bookings.find((booking) => booking.roomId === roomId && booking.status === "checked_in")
}

export function upcomingBookingForRoom(roomId: string, bookings: Booking[], today: DateString) {
  return bookings
    .filter(
      (booking) =>
        booking.roomId === roomId &&
        (booking.status === "confirmed" || booking.status === "pending") &&
        booking.checkOut > today,
    )
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]
}

/**
 * Single source of truth for room availability. Occupancy always wins, so a manual
 * maintenance or housekeeping change can never make an occupied room look available.
 */
export function roomStatus(room: Room, bookings: Booking[], today: DateString): RoomStatus {
  if (activeBookingForRoom(room.id, bookings)) return "occupied"
  if (room.maintenance) return "maintenance"
  if (room.housekeeping !== "clean") return "cleaning"
  const upcoming = upcomingBookingForRoom(room.id, bookings, today)
  if (upcoming && upcoming.checkIn <= today) return "reserved"
  return "available"
}

/* ---------- Food ---------- */

export function orderTotal(order: Pick<FoodOrder, "items">) {
  return round2(order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
}

/* ---------- Housekeeping ---------- */

export function isTaskOverdue(task: HousekeepingTask, now: Date) {
  return (task.status === "pending" || task.status === "in_progress") && parseISO(task.dueAt) < now
}

/* ---------- Guests ---------- */

export function guestStats(guestId: string, data: Pick<HotelData, "bookings" | "invoices">) {
  const stays = data.bookings.filter((booking) => booking.guestId === guestId)
  const completed = stays.filter((booking) => booking.status === "checked_out" || booking.status === "checked_in")
  const lastVisit = completed.map((booking) => booking.checkIn).sort().at(-1) ?? null
  const totalSpend = data.invoices
    .filter((invoice) => invoice.guestId === guestId && !invoice.voided)
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).paid, 0)
  return { visits: completed.length, lastVisit, totalSpend: round2(totalSpend), bookings: stays.length }
}

/* ---------- Reviews ---------- */

export function ratingSummary(reviews: Review[]) {
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }))
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
  return { average, count: reviews.length, distribution }
}

/* ---------- Time series ---------- */

export function daysInRange(from: DateString, to: DateString) {
  if (from > to) return []
  return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(toDateString)
}

export function rangeEndingToday(days: number, today: DateString) {
  return { from: toDateString(addDays(parseISO(today), -(days - 1))), to: today }
}

/** Collected revenue = recorded payments + delivered room-service orders, grouped by day. */
export function revenueSeries(data: Pick<HotelData, "invoices" | "orders">, from: DateString, to: DateString) {
  const days = daysInRange(from, to)
  const rooms = new Map<string, number>(days.map((day) => [day, 0]))
  const food = new Map<string, number>(days.map((day) => [day, 0]))
  for (const invoice of data.invoices) {
    if (invoice.voided) continue
    for (const payment of invoice.payments) {
      const day = payment.date.slice(0, 10)
      if (rooms.has(day)) rooms.set(day, (rooms.get(day) ?? 0) + payment.amount)
    }
  }
  for (const order of data.orders) {
    if (order.status !== "delivered") continue
    const day = order.createdAt.slice(0, 10)
    if (food.has(day)) food.set(day, (food.get(day) ?? 0) + orderTotal(order))
  }
  return days.map((day) => ({
    date: day,
    payments: round2(rooms.get(day) ?? 0),
    food: round2(food.get(day) ?? 0),
    total: round2((rooms.get(day) ?? 0) + (food.get(day) ?? 0)),
  }))
}

/** Share of rooms occupied each night (a night is counted against its check-in date). */
export function occupancySeries(data: Pick<HotelData, "bookings" | "rooms">, from: DateString, to: DateString) {
  const totalRooms = data.rooms.length || 1
  const stays = data.bookings.filter((booking) => booking.status !== "cancelled" && booking.status !== "pending")
  return daysInRange(from, to).map((day) => {
    const occupied = stays.filter((booking) => booking.checkIn <= day && booking.checkOut > day).length
    return { date: day, occupied, rate: Math.round((occupied / totalRooms) * 1000) / 10 }
  })
}

export function sumSeries<T>(series: T[], pick: (item: T) => number) {
  return round2(series.reduce((sum, item) => sum + pick(item), 0))
}

export function bookingsInRange(bookings: Booking[], from: DateString, to: DateString) {
  return bookings.filter((booking) => booking.createdAt.slice(0, 10) >= from && booking.createdAt.slice(0, 10) <= to)
}
