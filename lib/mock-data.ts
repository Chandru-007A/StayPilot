import { addDays, addHours, addMinutes, parseISO, setHours } from "date-fns"
import { bookingTotals } from "./calculations"
import { toDateString } from "./format"
import type {
  AppNotification,
  Booking,
  BookingSource,
  BookingStatus,
  Conversation,
  FoodOrder,
  Guest,
  HotelData,
  HotelSettings,
  HousekeepingTask,
  Invoice,
  MenuItem,
  Message,
  PaymentMethod,
  Review,
  Room,
  RoomType,
  StaffMember,
} from "./types"

/**
 * DEMONSTRATION DATA ONLY.
 * Every guest, booking, invoice, review and figure below is fictional and generated
 * deterministically relative to the moment the demo is seeded.
 */

export const DATA_VERSION = 1

function createRandom(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GUEST_NAMES = [
  "Aarav Mehta", "Diya Kapoor", "Rohan Iyer", "Ananya Rao", "Kabir Malhotra", "Ishita Sen",
  "Vihaan Nair", "Meera Joshi", "Arjun Pillai", "Sara Thomas", "Dev Chatterjee", "Priya Menon",
  "Neel Banerjee", "Tara Kulkarni", "Aditya Verma", "Riya Desai", "Kunal Bhatt", "Nisha Reddy",
  "Yash Agarwal", "Aisha Khan", "Siddharth Gupta", "Pooja Shetty", "Rahul Saxena", "Kavya Hegde",
  "Manav Chopra", "Zara Fernandes", "Omkar Patil", "Leela Krishnan", "Farhan Qureshi", "Sneha Das",
  "Varun Sinha", "Maya D'Souza", "Harsh Jain", "Anika Bose", "Nikhil Rathore", "Tanvi Mishra",
]

const CITIES = ["Mumbai", "Pune", "Delhi", "Chennai", "Kochi", "Hyderabad", "Kolkata", "Jaipur", "Goa", "Ahmedabad"]

const PREFERENCES = [
  "High floor, away from elevator",
  "Extra pillows",
  "Vegetarian breakfast",
  "Late checkout when possible",
  "Quiet room",
  "",
  "",
  "Airport pickup on arrival",
]

const ROOM_CONFIG: Record<RoomType, { capacity: number; price: number; amenities: string }> = {
  Standard: { capacity: 2, price: 3200, amenities: "Queen bed, work desk, rain shower" },
  Deluxe: { capacity: 3, price: 4800, amenities: "King bed, city view, minibar" },
  Suite: { capacity: 4, price: 8500, amenities: "Separate lounge, bathtub, butler call" },
  Family: { capacity: 5, price: 6200, amenities: "Two queen beds, sofa bed, kitchenette" },
}

const FLOOR_LAYOUT: RoomType[] = ["Standard", "Standard", "Deluxe", "Deluxe", "Family", "Suite"]

const MENU: Omit<MenuItem, "id">[] = [
  { name: "Masala Omelette", description: "Three-egg omelette with onion, chilli and coriander, served with toast.", category: "Breakfast", price: 280, available: true },
  { name: "Idli Sambar", description: "Steamed rice cakes with sambar and two chutneys.", category: "Breakfast", price: 220, available: true },
  { name: "Aloo Paratha", description: "Two stuffed flatbreads with curd and pickle.", category: "Breakfast", price: 260, available: true },
  { name: "Butter Chicken", description: "Tandoor-roasted chicken in tomato-butter gravy.", category: "Mains", price: 520, available: true },
  { name: "Paneer Tikka Masala", description: "Charred paneer in a spiced onion-tomato sauce.", category: "Mains", price: 460, available: true },
  { name: "Vegetable Biryani", description: "Dum-cooked basmati with seasonal vegetables and raita.", category: "Mains", price: 420, available: true },
  { name: "Grilled Fish", description: "Catch of the day with lemon butter and greens.", category: "Mains", price: 640, available: false },
  { name: "Club Sandwich", description: "Triple-decker with chicken, egg and fries.", category: "Snacks", price: 340, available: true },
  { name: "Masala Fries", description: "Crispy fries tossed in chaat masala.", category: "Snacks", price: 180, available: true },
  { name: "Gulab Jamun", description: "Two warm milk dumplings in cardamom syrup.", category: "Desserts", price: 160, available: true },
  { name: "Chocolate Brownie", description: "Served warm with vanilla ice cream.", category: "Desserts", price: 240, available: true },
  { name: "Masala Chai", description: "Pot of spiced tea for two.", category: "Beverages", price: 120, available: true },
  { name: "Fresh Lime Soda", description: "Sweet, salted or mixed.", category: "Beverages", price: 140, available: true },
  { name: "Cold Coffee", description: "Blended with ice cream.", category: "Beverages", price: 190, available: true },
]

const STAFF: StaffMember[] = [
  { id: "st-01", name: "Lakshmi Naidu", role: "Housekeeping", shift: "Morning" },
  { id: "st-02", name: "Ravi Kumar", role: "Housekeeping", shift: "Morning" },
  { id: "st-03", name: "Fatima Shaikh", role: "Housekeeping", shift: "Evening" },
  { id: "st-04", name: "Suresh Yadav", role: "Housekeeping", shift: "Evening" },
  { id: "st-05", name: "Joseph Mathew", role: "Maintenance", shift: "Morning" },
  { id: "st-06", name: "Imran Ali", role: "Maintenance", shift: "Evening" },
  { id: "st-07", name: "Neha Arora", role: "Front desk", shift: "Morning" },
  { id: "st-08", name: "Gopal Rao", role: "Kitchen", shift: "Evening" },
]

export const DEFAULT_SETTINGS: HotelSettings = {
  hotel: {
    name: "StayPilot Demo Hotel",
    email: "frontdesk@staypilot-demo.example",
    phone: "+91 80 4000 0000",
    address: "12 Residency Road",
    city: "Bengaluru, Karnataka",
    timezone: "Asia/Kolkata",
    currency: "INR",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    policy: "Valid government photo ID required at check-in. Free cancellation up to 48 hours before arrival.",
    defaultTaxRate: 12,
  },
  profile: {
    name: "Demo Manager",
    email: "manager@staypilot-demo.example",
    role: "Front Office Manager",
    phone: "+91 98450 00000",
  },
  notifications: {
    bookings: true,
    payments: true,
    housekeeping: true,
    messages: true,
    food: true,
    markReadOnOpen: false,
  },
  density: "comfortable",
}

export function createSeedData(now: Date = new Date()): HotelData {
  const random = createRandom(20260412)
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)]
  const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min
  const today = toDateString(now)
  const day = (offset: number) => toDateString(addDays(now, offset))
  const at = (dateString: string, hour: number, minute = 0) =>
    addMinutes(setHours(parseISO(dateString), hour), minute).toISOString()

  const guests: Guest[] = GUEST_NAMES.map((name, index) => {
    const [first, last] = name.toLowerCase().replace(/'/g, "").split(" ")
    return {
      id: `g-${String(index + 1).padStart(3, "0")}`,
      name,
      email: `${first}.${last}@example.com`,
      phone: `+91 9${String(800000000 + index * 7919).slice(0, 4)} ${String(10000 + index * 37).slice(0, 5)}`,
      city: pick(CITIES),
      status: index % 9 === 0 ? "vip" : index % 13 === 5 ? "inactive" : "regular",
      preferences: pick(PREFERENCES),
      notes: index % 7 === 0 ? "Corporate account guest." : "",
      createdAt: addDays(now, -between(100, 400)).toISOString(),
    }
  })

  const rooms: Room[] = []
  for (let floor = 1; floor <= 4; floor++) {
    FLOOR_LAYOUT.forEach((type, index) => {
      const config = ROOM_CONFIG[type]
      rooms.push({
        id: `r-${floor}0${index + 1}`,
        number: `${floor}0${index + 1}`,
        type,
        floor,
        capacity: config.capacity,
        pricePerNight: config.price + (floor - 1) * 200,
        housekeeping: "clean",
        maintenance: false,
        maintenanceNote: "",
        amenities: config.amenities,
      })
    })
  }

  const sources: BookingSource[] = ["Direct", "Website", "Website", "Phone", "Travel agent", "Walk-in"]
  const bookings: Booking[] = []
  const invoices: Invoice[] = []
  let referenceCounter = 10001
  let invoiceCounter = 1
  const year = now.getFullYear()

  for (const room of rooms) {
    let cursor = -between(88, 95)
    while (cursor < 21) {
      cursor += between(0, 3)
      const nights = between(1, 5)
      const checkInOffset = cursor
      const checkOutOffset = cursor + nights
      cursor = checkOutOffset
      if (checkInOffset > 20) break

      const checkIn = day(checkInOffset)
      const checkOut = day(checkOutOffset)
      let status: BookingStatus
      if (checkOutOffset <= 0) status = random() < 0.08 ? "cancelled" : "checked_out"
      else if (checkInOffset < 0 || (checkInOffset === 0 && random() < 0.25)) status = "checked_in"
      else status = random() < 0.2 ? "pending" : random() < 0.05 ? "cancelled" : "confirmed"

      // Keep today's departures still in-house so the front desk has work to do.
      if (status === "checked_out" && checkOutOffset === 0) status = "checked_in"

      const guest = pick(guests)
      const adults = Math.min(room.capacity, between(1, 3))
      const children = room.capacity - adults > 0 && random() < 0.3 ? 1 : 0
      const extraCharges = random() < 0.35 ? between(2, 12) * 100 : 0
      const createdOffset = checkInOffset - between(2, 25)
      const booking: Booking = {
        id: `b-${referenceCounter}`,
        reference: `SP-${referenceCounter}`,
        guestId: guest.id,
        roomId: room.id,
        checkIn,
        checkOut,
        adults,
        children,
        ratePerNight: room.pricePerNight,
        extraCharges,
        taxRate: 12,
        specialRequests: random() < 0.25 ? pick(["Early check-in requested", "Baby cot", "Anniversary decoration", "Ground-floor parking"]) : "",
        notes: "",
        source: pick(sources),
        status,
        invoiceId: null,
        createdAt: at(day(Math.min(createdOffset, 0)), between(8, 20), between(0, 59)),
        checkedInAt: status === "checked_in" || status === "checked_out" ? at(checkIn, 14, between(0, 50)) : null,
        checkedOutAt: status === "checked_out" ? at(checkOut, 10, between(0, 55)) : null,
        cancelledAt: status === "cancelled" ? at(day(Math.min(checkInOffset - 1, 0)), 12) : null,
      }
      referenceCounter++

      if (status !== "cancelled") {
        const totals = bookingTotals(booking)
        const invoiceId = `inv-${invoiceCounter}`
        const lineItems = [
          {
            id: `${invoiceId}-room`,
            description: `Room ${room.number} · ${room.type} (${totals.nights} night${totals.nights === 1 ? "" : "s"})`,
            quantity: totals.nights,
            unitPrice: booking.ratePerNight,
          },
        ]
        if (extraCharges > 0) {
          lineItems.push({ id: `${invoiceId}-extras`, description: "Minibar & in-room services", quantity: 1, unitPrice: extraCharges })
        }
        const method = (): PaymentMethod => pick(["card", "upi", "upi", "cash", "bank_transfer"] as const)
        const payments = []
        if (status === "checked_out") {
          const roll = random()
          if (roll < 0.82) {
            payments.push({ id: `${invoiceId}-p1`, amount: totals.total, method: method(), date: at(checkOut, 10, 30), note: "Settled at checkout" })
          } else if (roll < 0.93) {
            payments.push({ id: `${invoiceId}-p1`, amount: Math.round(totals.total * 0.4), method: method(), date: at(checkIn, 15), note: "Advance" })
          }
        } else if (status === "checked_in" && random() < 0.6) {
          payments.push({ id: `${invoiceId}-p1`, amount: Math.round(totals.total * 0.3), method: method(), date: at(checkIn, 14, 20), note: "Deposit at check-in" })
        } else if ((status === "confirmed" || status === "pending") && random() < 0.4) {
          payments.push({ id: `${invoiceId}-p1`, amount: Math.round(totals.total * 0.2), method: "card" as PaymentMethod, date: booking.createdAt, note: "Online advance" })
        }
        invoices.push({
          id: invoiceId,
          number: `INV-${year}-${String(invoiceCounter).padStart(4, "0")}`,
          guestId: guest.id,
          bookingId: booking.id,
          issueDate: status === "checked_out" ? checkOut : booking.createdAt.slice(0, 10),
          dueDate: status === "checked_out" ? toDateString(addDays(parseISO(checkOut), 7)) : checkOut,
          lineItems,
          taxRate: 12,
          payments,
          finalized: status === "checked_out",
          voided: false,
          notes: "",
        })
        booking.invoiceId = invoiceId
        invoiceCounter++
      }
      bookings.push(booking)
    }
  }

  const occupiedRoomIds = new Set(bookings.filter((b) => b.status === "checked_in").map((b) => b.roomId))
  const freeRooms = rooms.filter((room) => !occupiedRoomIds.has(room.id))
  const staffBy = (role: string) => STAFF.filter((member) => member.role === role)

  const tasks: HousekeepingTask[] = []
  let taskCounter = 1
  const addTask = (task: Omit<HousekeepingTask, "id" | "createdAt" | "completedAt" | "completionNotes">) => {
    tasks.push({ ...task, id: `t-${taskCounter++}`, createdAt: addHours(now, -between(2, 10)).toISOString(), completedAt: null, completionNotes: "" })
  }

  // Rooms freed by recent checkouts still need attention.
  freeRooms.slice(0, 4).forEach((room, index) => {
    room.housekeeping = index === 0 ? "cleaning" : "dirty"
    addTask({
      roomId: room.id,
      category: "housekeeping",
      type: "Checkout clean",
      priority: index === 1 ? "urgent" : "high",
      staffId: index === 3 ? null : pick(staffBy("Housekeeping")).id,
      dueAt: addHours(now, index === 2 ? -2 : index + 1).toISOString(),
      status: index === 0 ? "in_progress" : "pending",
      notes: index === 1 ? "VIP arriving this afternoon." : "",
      blocksRoom: false,
    })
  })
  const maintenanceRoom = freeRooms[freeRooms.length - 1]
  if (maintenanceRoom) {
    maintenanceRoom.maintenance = true
    maintenanceRoom.maintenanceNote = "AC unit not cooling — technician scheduled."
    addTask({
      roomId: maintenanceRoom.id,
      category: "maintenance",
      type: "HVAC",
      priority: "high",
      staffId: "st-05",
      dueAt: addHours(now, 5).toISOString(),
      status: "in_progress",
      notes: "AC unit not cooling. Replace capacitor if needed.",
      blocksRoom: true,
    })
  }
  const inHouse = bookings.filter((b) => b.status === "checked_in").slice(0, 3)
  inHouse.forEach((booking, index) => {
    addTask({
      roomId: booking.roomId,
      category: index === 2 ? "maintenance" : "housekeeping",
      type: index === 2 ? "Plumbing" : index === 1 ? "Turndown" : "Stayover clean",
      priority: index === 2 ? "medium" : "low",
      staffId: index === 2 ? "st-06" : pick(staffBy("Housekeeping")).id,
      dueAt: addHours(now, index === 0 ? -1 : 6).toISOString(),
      status: "pending",
      notes: index === 2 ? "Guest reports slow-draining sink." : "",
      blocksRoom: false,
    })
  })
  tasks.push({
    id: `t-${taskCounter++}`,
    roomId: rooms[0].id,
    category: "housekeeping",
    type: "Inspection",
    priority: "low",
    staffId: "st-01",
    dueAt: addHours(now, -20).toISOString(),
    status: "completed",
    notes: "",
    completionNotes: "Room inspected, all amenities restocked.",
    blocksRoom: false,
    createdAt: addHours(now, -26).toISOString(),
    completedAt: addHours(now, -21).toISOString(),
  })

  const menu: MenuItem[] = MENU.map((item, index) => ({ ...item, id: `m-${index + 1}` }))
  const orderable = menu.filter((item) => item.available)
  const orders: FoodOrder[] = []
  let orderCounter = 1001
  const stayed = bookings.filter((b) => (b.status === "checked_in" || b.status === "checked_out") && b.checkIn >= day(-45))
  for (let i = 0; i < 70; i++) {
    const booking = pick(stayed)
    if (!booking) break
    const orderDay = booking.status === "checked_in" && i % 6 === 0 ? today : booking.checkIn
    if (orderDay > today) continue
    const lines = Array.from({ length: between(1, 3) }, () => pick(orderable))
    const items = Array.from(new Map(lines.map((item) => [item.id, item])).values()).map((item) => ({
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      quantity: between(1, 2),
      unitPrice: item.price,
    }))
    const createdAt = orderDay === today ? addMinutes(now, -between(5, 180)).toISOString() : at(orderDay, between(8, 22), between(0, 59))
    const isToday = orderDay === today
    const status: FoodOrder["status"] = isToday
      ? pick(["new", "preparing", "ready", "delivered"] as const)
      : random() < 0.06
        ? "cancelled"
        : "delivered"
    orders.push({
      id: `o-${orderCounter}`,
      number: `RS-${orderCounter}`,
      guestId: booking.guestId,
      roomId: booking.roomId,
      items,
      notes: random() < 0.2 ? "Less spicy, please." : "",
      status,
      createdAt,
      updatedAt: createdAt,
    })
    orderCounter++
  }
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const reviewTemplates = [
    { rating: 5, title: "Wonderful stay", body: "Spotless room, quick check-in and the breakfast spread was excellent. Would happily return." },
    { rating: 4, title: "Great location", body: "Close to everything we needed. Room was comfortable, though the Wi-Fi dropped a couple of times." },
    { rating: 5, title: "Staff went above and beyond", body: "The front desk arranged a late checkout for us without any fuss. Thank you!" },
    { rating: 3, title: "Decent but noisy", body: "Room was clean but we could hear traffic through the night. Ask for a room facing the courtyard." },
    { rating: 4, title: "Good value", body: "Fair price for what you get. Room service was prompt and the food was tasty." },
    { rating: 2, title: "AC issues", body: "Air conditioning struggled during our stay. Maintenance came but it took a while." },
    { rating: 5, title: "Perfect for families", body: "The family room had plenty of space and the kids loved the pool." },
    { rating: 4, title: "Comfortable beds", body: "Slept really well. Checkout queue was a little slow in the morning." },
    { rating: 1, title: "Billing confusion", body: "We were charged for minibar items we did not use. It was eventually corrected." },
    { rating: 5, title: "Will be back", body: "Second visit and just as good as the first. Consistent and welcoming." },
  ] as const
  const reviewedStays = bookings.filter((b) => b.status === "checked_out").slice(-60)
  const reviews: Review[] = Array.from({ length: 18 }, (_, index) => {
    const stay = reviewedStays[(index * 7) % reviewedStays.length]
    const template = reviewTemplates[index % reviewTemplates.length]
    const guest = guests.find((g) => g.id === stay?.guestId)
    const responded = index % 3 === 0
    return {
      id: `rv-${index + 1}`,
      guestId: guest?.id ?? null,
      reviewerName: guest?.name ?? "Anonymous guest",
      bookingId: stay?.id ?? null,
      rating: template.rating,
      title: template.title,
      body: template.body,
      date: stay ? toDateString(addDays(parseISO(stay.checkOut), between(0, 3))) : today,
      channel: pick(["Direct survey", "Website", "Travel portal"] as const),
      flagged: template.rating <= 1,
      response: responded
        ? { body: `Thank you for your feedback, ${guest?.name.split(" ")[0] ?? "and"}. We look forward to welcoming you again.`, state: "saved" as const, updatedAt: addDays(now, -between(1, 10)).toISOString() }
        : null,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))

  const conversationSeeds = [
    { subject: "Early check-in request", category: "Booking", guestMsg: "Hi, our flight lands at 8 AM. Is early check-in possible?", reply: "We'll do our best — I've noted the request on your booking." },
    { subject: "Extra towels", category: "Request", guestMsg: "Could we get two extra bath towels sent up, please?", reply: null },
    { subject: "Noise from corridor", category: "Complaint", guestMsg: "There's been loud noise in the corridor since 11 PM.", reply: "Apologies — security has been informed and will check right away." },
    { subject: "Airport transfer", category: "Request", guestMsg: "Can you arrange a cab to the airport for tomorrow at 6 AM?", reply: null },
    { subject: "Invoice copy", category: "General", guestMsg: "Please share a GST invoice for my company reimbursement.", reply: "Sure, the accounts team will prepare it today." },
    { subject: "Dinner reservation", category: "General", guestMsg: "Is the rooftop restaurant open tonight? Table for four at 8?", reply: null },
    { subject: "Change of dates", category: "Booking", guestMsg: "I need to push my arrival by one day. Is that possible?", reply: null },
    { subject: "Wi-Fi not working", category: "Complaint", guestMsg: "Wi-Fi keeps disconnecting in my room.", reply: "Our IT team has reset the access point on your floor. Please let us know if it persists." },
  ] as const
  const conversations: Conversation[] = conversationSeeds.map((seed, index) => {
    const booking = bookings.filter((b) => b.status === "checked_in" || b.status === "confirmed")[index * 2] ?? bookings[index]
    const started = addMinutes(now, -(index * 95 + between(10, 60)))
    const messages: Message[] = [
      { id: `msg-${index}-1`, sender: "guest", body: seed.guestMsg, sentAt: started.toISOString(), simulated: false },
    ]
    if (seed.reply) {
      messages.push({ id: `msg-${index}-2`, sender: "staff" as const, body: seed.reply, sentAt: addMinutes(started, 12).toISOString(), simulated: false })
    }
    return {
      id: `c-${index + 1}`,
      guestId: booking.guestId,
      subject: seed.subject,
      category: seed.category,
      unread: !seed.reply,
      archived: false,
      messages,
    }
  })

  const notifications: AppNotification[] = [
    { id: "n-1", kind: "booking", title: "New reservation", body: `${bookings.find((b) => b.status === "pending")?.reference ?? "A booking"} is awaiting confirmation.`, href: "/bookings?status=pending", read: false, createdAt: addMinutes(now, -15).toISOString() },
    { id: "n-2", kind: "housekeeping", title: "Urgent cleaning task", body: "A checkout clean is marked urgent.", href: "/housekeeping", read: false, createdAt: addMinutes(now, -42).toISOString() },
    { id: "n-3", kind: "message", title: "Guest message", body: "New request: extra towels.", href: "/messages", read: false, createdAt: addMinutes(now, -70).toISOString() },
    { id: "n-4", kind: "payment", title: "Overdue invoice", body: "One or more invoices are past due.", href: "/billing?status=overdue", read: true, createdAt: addHours(now, -5).toISOString() },
    { id: "n-5", kind: "food", title: "Room-service order", body: "New orders are waiting in the kitchen queue.", href: "/food-delivery", read: true, createdAt: addHours(now, -7).toISOString() },
  ]

  return {
    version: DATA_VERSION,
    seededAt: now.toISOString(),
    guests,
    rooms,
    bookings,
    invoices,
    menu,
    orders,
    conversations,
    reviews,
    staff: STAFF,
    tasks,
    notifications,
    settings: structuredClone(DEFAULT_SETTINGS),
  }
}
