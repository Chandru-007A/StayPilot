import Link from "next/link"
import { AlertTriangle, ChevronRight, MessageSquare, Receipt, SprayCan, UtensilsCrossed } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AttentionCardProps {
  overdueTasks: number
  openTasks: number
  newOrders: number
  unreadMessages: number
  outstandingCount: number
}

export function AttentionCard({ overdueTasks, openTasks, newOrders, unreadMessages, outstandingCount }: AttentionCardProps) {
  const rows = [
    {
      href: "/housekeeping",
      icon: overdueTasks > 0 ? AlertTriangle : SprayCan,
      label: "Housekeeping tasks",
      detail: overdueTasks > 0 ? `${overdueTasks} overdue` : "On schedule",
      count: openTasks,
      urgent: overdueTasks > 0,
    },
    { href: "/food-delivery", icon: UtensilsCrossed, label: "New room-service orders", detail: "Waiting for the kitchen", count: newOrders, urgent: newOrders > 0 },
    { href: "/messages", icon: MessageSquare, label: "Unread guest messages", detail: "In the inbox", count: unreadMessages, urgent: unreadMessages > 0 },
    { href: "/billing?status=outstanding", icon: Receipt, label: "Unsettled invoices", detail: "Finalized, balance due", count: outstandingCount, urgent: false },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Needs attention</CardTitle>
        <CardDescription>Open work across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    row.urgent ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
                  )}
                >
                  <row.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{row.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.detail}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{row.count}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
