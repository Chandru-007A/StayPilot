import { cn } from "@/lib/utils"

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary"

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-primary/20 bg-primary/10 text-primary",
  primary: "border-primary bg-primary text-primary-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
}

const DOT_CLASSES: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-primary",
  primary: "bg-primary-foreground",
  neutral: "bg-muted-foreground",
}

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // bookings
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  checked_in: { label: "Checked in", tone: "success" },
  checked_out: { label: "Checked out", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  // payments & invoices
  unpaid: { label: "Unpaid", tone: "danger" },
  partial: { label: "Partially paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  no_invoice: { label: "No invoice", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  overdue: { label: "Overdue", tone: "danger" },
  void: { label: "Void", tone: "neutral" },
  // rooms
  available: { label: "Available", tone: "success" },
  occupied: { label: "Occupied", tone: "info" },
  reserved: { label: "Reserved", tone: "warning" },
  cleaning: { label: "Cleaning", tone: "warning" },
  maintenance: { label: "Maintenance", tone: "danger" },
  clean: { label: "Clean", tone: "success" },
  dirty: { label: "Dirty", tone: "danger" },
  // food
  new: { label: "New", tone: "info" },
  preparing: { label: "Preparing", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
  delivered: { label: "Delivered", tone: "neutral" },
  // tasks
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  // priorities
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
  // guests
  regular: { label: "Regular", tone: "neutral" },
  vip: { label: "VIP", tone: "primary" },
  inactive: { label: "Inactive", tone: "neutral" },
}

interface StatusBadgeProps {
  status: string
  label?: string
  tone?: Tone
  className?: string
}

export function StatusBadge({ status, label, tone, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, tone: "neutral" as Tone }
  const resolvedTone = tone ?? config.tone
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[resolvedTone])} aria-hidden="true" />
      {label ?? config.label}
    </span>
  )
}
