import { z } from "zod"

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date")
const money = z.coerce.number({ invalid_type_error: "Enter an amount" }).min(0, "Cannot be negative")

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean(),
})

export const guestSchema = z.object({
  name: z.string().trim().min(2, "Enter the guest's full name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,16}$/, "Enter a phone number with 10–15 digits"),
  city: z.string().trim().max(60),
  status: z.enum(["regular", "vip", "inactive"]),
  preferences: z.string().max(300),
  notes: z.string().max(500),
})
export type GuestFormValues = z.infer<typeof guestSchema>

export const bookingSchema = z
  .object({
    guestId: z.string().min(1, "Select a guest"),
    roomId: z.string().min(1, "Select a room"),
    checkIn: dateField,
    checkOut: dateField,
    adults: z.coerce.number().int().min(1, "At least 1 adult").max(8),
    children: z.coerce.number().int().min(0).max(6),
    ratePerNight: z.coerce.number().positive("Rate must be greater than zero"),
    extraCharges: money,
    taxRate: z.coerce.number().min(0).max(28, "Max 28%"),
    specialRequests: z.string().max(300),
    notes: z.string().max(500),
    source: z.enum(["Direct", "Website", "Phone", "Travel agent", "Walk-in"]),
    status: z.enum(["pending", "confirmed"]),
    paymentStatus: z.enum(["unpaid", "partial", "paid"]),
    depositAmount: money,
    paymentMethod: z.enum(["cash", "card", "upi", "bank_transfer"]),
  })
  .refine((values) => values.checkOut > values.checkIn, {
    path: ["checkOut"],
    message: "Check-out must be after check-in",
  })
export type BookingFormValues = z.infer<typeof bookingSchema>

export const roomSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z-]{1,6}$/, "Use 1–6 letters or digits"),
  type: z.enum(["Standard", "Deluxe", "Suite", "Family"]),
  floor: z.coerce.number().int().min(0, "Floor must be 0 or higher").max(60),
  capacity: z.coerce.number().int().min(1).max(8),
  pricePerNight: z.coerce.number().positive("Price must be greater than zero"),
  amenities: z.string().max(200),
})
export type RoomFormValues = z.infer<typeof roomSchema>

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Required"),
  quantity: z.coerce.number().positive("> 0"),
  unitPrice: money,
})

export const invoiceSchema = z
  .object({
    guestId: z.string().min(1, "Select a guest"),
    bookingId: z.string(),
    issueDate: dateField,
    dueDate: dateField,
    taxRate: z.coerce.number().min(0).max(28, "Max 28%"),
    notes: z.string().max(500),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  })
  .refine((values) => values.dueDate >= values.issueDate, { path: ["dueDate"], message: "Due date must be on or after issue date" })
export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, "Enter an item name").max(60),
  description: z.string().trim().max(200),
  category: z.enum(["Breakfast", "Mains", "Snacks", "Desserts", "Beverages"]),
  price: z.coerce.number().positive("Price must be greater than zero"),
  available: z.boolean(),
})
export type MenuItemFormValues = z.infer<typeof menuItemSchema>

export const taskSchema = z.object({
  roomId: z.string().min(1, "Select a room"),
  category: z.enum(["housekeeping", "maintenance"]),
  type: z.enum(["Checkout clean", "Stayover clean", "Deep clean", "Turndown", "Inspection", "Plumbing", "Electrical", "HVAC", "Furniture"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  staffId: z.string(),
  dueAt: z.string().min(1, "Select a due time"),
  notes: z.string().max(300),
  blocksRoom: z.boolean(),
})
export type TaskFormValues = z.infer<typeof taskSchema>

export const hotelProfileSchema = z.object({
  name: z.string().trim().min(2, "Hotel name is required").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{8,18}$/, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Address is required"),
  city: z.string().trim().min(2, "City is required"),
  timezone: z.string().min(1),
  currency: z.literal("INR"),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  policy: z.string().max(600),
  defaultTaxRate: z.coerce.number().min(0).max(28, "Max 28%"),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.string().trim().min(2, "Role is required"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{10,16}$/, "Enter a valid phone number"),
})
