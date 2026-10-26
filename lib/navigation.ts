import {
  ArrowRightLeft,
  BarChart3,
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  SprayCan,
  Star,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  description: string
  icon: LucideIcon
  badge?: "messages" | "orders"
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Front office",
    items: [
      { href: "/dashboard", label: "Dashboard", description: "Today at a glance", icon: LayoutDashboard },
      { href: "/bookings", label: "Bookings", description: "Reservation management", icon: CalendarDays },
      { href: "/check-in-out", label: "Check-in / out", description: "Arrivals and departures", icon: ArrowRightLeft },
      { href: "/rooms", label: "Rooms", description: "Room inventory", icon: BedDouble },
      { href: "/guests", label: "Guests", description: "Guest directory", icon: Users },
    ],
  },
  {
    label: "Guest experience",
    items: [
      { href: "/messages", label: "Messages", description: "Guest inbox", icon: MessageSquare, badge: "messages" },
      { href: "/reviews", label: "Reviews", description: "Customer reviews", icon: Star },
      { href: "/food-delivery", label: "Room service", description: "Food orders and menu", icon: UtensilsCrossed, badge: "orders" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/billing", label: "Billing", description: "Invoices and payments", icon: Receipt },
      { href: "/housekeeping", label: "Housekeeping", description: "Cleaning and maintenance", icon: SprayCan },
      { href: "/reports", label: "Reports", description: "Performance reports", icon: BarChart3 },
      { href: "/settings", label: "Settings", description: "Hotel and account", icon: Settings },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
}
