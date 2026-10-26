import Link from "next/link"
import type { RoomStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ROWS: { status: RoomStatus; label: string; bar: string }[] = [
  { status: "available", label: "Available", bar: "bg-success" },
  { status: "occupied", label: "Occupied", bar: "bg-primary" },
  { status: "reserved", label: "Reserved for arrival", bar: "bg-chart-5" },
  { status: "cleaning", label: "Needs cleaning", bar: "bg-warning" },
  { status: "maintenance", label: "Maintenance", bar: "bg-destructive" },
]

export function RoomStatusCard({ counts, total }: { counts: Record<RoomStatus, number>; total: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Room status</CardTitle>
        <CardDescription>Live across {total} rooms</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Room status distribution">
          {ROWS.map((row) =>
            counts[row.status] > 0 ? (
              <span key={row.status} className={cn("h-full", row.bar)} style={{ width: `${(counts[row.status] / Math.max(total, 1)) * 100}%` }} />
            ) : null,
          )}
        </div>
        <ul className="flex flex-col gap-1">
          {ROWS.map((row) => (
            <li key={row.status}>
              <Link
                href={`/rooms?status=${row.status}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2.5">
                  <span className={cn("size-2.5 rounded-sm", row.bar)} aria-hidden="true" />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums">{counts[row.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
