export type ID = string

/** ISO calendar date, `YYYY-MM-DD`. */
export type DateString = string
/** Full ISO timestamp. */
export type DateTimeString = string

export type GuestStatus = "regular" | "vip" | "inactive"

export interface Guest {
  id: ID
  name: string
  email: string
  phone: string
  city: string
  status: GuestStatus
  preferences: string
  notes: string
  createdAt: DateTimeString
}

export type RoomType = "Standard" | "Deluxe" | "Suite" | "Family"
export type HousekeepingState = "clean" | "dirty" | "cleaning"
/** Derived, never stored directly. */
export type RoomStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance"

export interface Room {
  id: ID
  number: string
  type: RoomType
  floor: number
  capacity: number
  pricePerNight: number
  housekeeping: HousekeepingState
  maintenance: boolean
  maintenanceNote: string
  amenities: string
}

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"
export type BookingSource = "Direct" | "Website" | "Phone" | "Travel agent" | "Walk-in"

export interface Booking {
  id: ID
  reference: string
  guestId: ID
  roomId: ID
  checkIn: DateString
  checkOut: DateString
  adults: number
  children: number
  ratePerNight: number
  extraCharges: number
  taxRate: number
  specialRequests: string
  notes: string
  source: BookingSource
  status: BookingStatus
  invoiceId: ID | null
  createdAt: DateTimeString
  checkedInAt: DateTimeString | null
  checkedOutAt: DateTimeString | null
  cancelledAt: DateTimeString | null
}

/** Derived from the linked invoice. */
export type PaymentStatus = "unpaid" | "partial" | "paid" | "no_invoice"

export interface InvoiceLineItem {
  id: ID
  description: string
  quantity: number
  unitPrice: number
}

export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer"

export interface PaymentRecord {
  id: ID
  amount: number
  method: PaymentMethod
  date: DateTimeString
  note: string
}

/** Derived from totals, finalization and due date. */
export type InvoiceStatus = "draft" | "unpaid" | "partial" | "paid" | "overdue" | "void"

export interface Invoice {
  id: ID
  number: string
  guestId: ID
  bookingId: ID | null
  issueDate: DateString
  dueDate: DateString
  lineItems: InvoiceLineItem[]
  taxRate: number
  payments: PaymentRecord[]
  finalized: boolean
  voided: boolean
  notes: string
}

export type MenuCategory = "Breakfast" | "Mains" | "Snacks" | "Desserts" | "Beverages"

export interface MenuItem {
  id: ID
  name: string
  description: string
  category: MenuCategory
  price: number
  available: boolean
}

export type FoodOrderStatus = "new" | "preparing" | "ready" | "delivered" | "cancelled"

export interface FoodOrderItem {
  menuItemId: ID
  name: string
  category: MenuCategory
  quantity: number
  unitPrice: number
}

export interface FoodOrder {
  id: ID
  number: string
  guestId: ID
  roomId: ID
  items: FoodOrderItem[]
  notes: string
  status: FoodOrderStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export type MessageCategory = "Booking" | "Request" | "Complaint" | "General"

export interface Message {
  id: ID
  sender: "guest" | "staff"
  body: string
  sentAt: DateTimeString
  simulated: boolean
}

export interface Conversation {
  id: ID
  guestId: ID
  subject: string
  category: MessageCategory
  unread: boolean
  archived: boolean
  messages: Message[]
}

export type ReviewChannel = "Direct survey" | "Website" | "Travel portal"

export interface ReviewResponse {
  body: string
  state: "draft" | "saved"
  updatedAt: DateTimeString
}

export interface Review {
  id: ID
  guestId: ID | null
  reviewerName: string
  bookingId: ID | null
  rating: 1 | 2 | 3 | 4 | 5
  title: string
  body: string
  date: DateString
  channel: ReviewChannel
  flagged: boolean
  response: ReviewResponse | null
}

export type StaffRole = "Housekeeping" | "Maintenance" | "Front desk" | "Kitchen"

export interface StaffMember {
  id: ID
  name: string
  role: StaffRole
  shift: "Morning" | "Evening" | "Night"
}

export type TaskCategory = "housekeeping" | "maintenance"
export type TaskType =
  | "Checkout clean"
  | "Stayover clean"
  | "Deep clean"
  | "Turndown"
  | "Inspection"
  | "Plumbing"
  | "Electrical"
  | "HVAC"
  | "Furniture"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface HousekeepingTask {
  id: ID
  roomId: ID
  category: TaskCategory
  type: TaskType
  priority: TaskPriority
  staffId: ID | null
  dueAt: DateTimeString
  status: TaskStatus
  notes: string
  completionNotes: string
  blocksRoom: boolean
  createdAt: DateTimeString
  completedAt: DateTimeString | null
}

export type NotificationKind = "booking" | "payment" | "housekeeping" | "message" | "food" | "system"

export interface AppNotification {
  id: ID
  kind: NotificationKind
  title: string
  body: string
  href: string
  read: boolean
  createdAt: DateTimeString
}

export interface HotelProfile {
  name: string
  email: string
  phone: string
  address: string
  city: string
  timezone: string
  currency: "INR"
  checkInTime: string
  checkOutTime: string
  policy: string
  defaultTaxRate: number
}

export interface UserProfile {
  name: string
  email: string
  role: string
  phone: string
}

export interface NotificationPreferences {
  bookings: boolean
  payments: boolean
  housekeeping: boolean
  messages: boolean
  food: boolean
  markReadOnOpen: boolean
}

export interface HotelSettings {
  hotel: HotelProfile
  profile: UserProfile
  notifications: NotificationPreferences
  density: "comfortable" | "compact"
}

export interface HotelData {
  version: number
  seededAt: DateTimeString
  guests: Guest[]
  rooms: Room[]
  bookings: Booking[]
  invoices: Invoice[]
  menu: MenuItem[]
  orders: FoodOrder[]
  conversations: Conversation[]
  reviews: Review[]
  staff: StaffMember[]
  tasks: HousekeepingTask[]
  notifications: AppNotification[]
  settings: HotelSettings
}
