import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: LucideIcon
  href?: string
  tone?: "default" | "warning" | "danger" | "success"
}

const ICON_TONES = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
}

export function StatCard({ label, value, hint, icon: Icon, href, tone = "default" }: StatCardProps) {
  const body = (
    <Card className={cn("flex h-full flex-col gap-3 p-5", href && "transition-colors hover:border-primary/40 hover:bg-accent/40")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", ICON_TONES[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </Card>
  )
  if (!href) return body
  return (
    <Link href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  )
}
