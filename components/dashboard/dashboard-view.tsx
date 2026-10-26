"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, BedDouble, CalendarCheck, CalendarX, IndianRupee, Plus, Wallet } from "lucide-react"
import { useHotel } from "@/services/store"
import {
  invoiceTotals,
  isTaskOverdue,
  outstandingInvoices,
  rangeEndingToday,
  revenueSeries,
  roomStatus,
  sumSeries,
} from "@/lib/calculations"
import { formatCurrency, formatPercent, todayString } from "@/lib/format"
import type { RoomStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { RevenueChart } from "./revenue-chart"
import { RoomStatusCard } from "./room-status-card"
import { MovementsCard } from "./movements-card"
import { AttentionCard } from "./attention-card"

export function DashboardView() {
  const data = useHotel()
  const today = todayString()

  const summary = useMemo(() => {
    const statusCounts: Record<RoomStatus, number> = { available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0 }
    for (const room of data.rooms) statusCounts[roomStatus(room, data.bookings, today)] += 1
    const occupancy = data.rooms.length ? (statusCounts.occupied / data.rooms.length) * 100 : 0

    const arrivals = data.bookings.filter(
      (booking) => booking.checkIn === today && (booking.status === "confirmed" || booking.status === "pending"),
    )
    const arrivedToday = data.bookings.filter((booking) => booking.status === "checked_in" && booking.checkedInAt?.slice(0, 10) === today)
    const departures = data.bookings.filter((booking) => booking.status === "checked_in" && booking.checkOut <= today)
    const departedToday = data.bookings.filter((booking) => booking.status === "checked_out" && booking.checkedOutAt?.slice(0, 10) === today)

    const range = rangeEndingToday(14, today)
    const series = revenueSeries(data, range.from, range.to)
    const todayRevenue = series.at(-1)?.total ?? 0

    const outstanding = outstandingInvoices(data.invoices)
    const outstandingTotal = outstanding.reduce((sum, invoice) => sum + invoiceTotals(invoice).balance, 0)

    const now = new Date()
    const overdueTasks = data.tasks.filter((task) => isTaskOverdue(task, now)).length
    const openTasks = data.tasks.filter((task) => task.status === "pending" || task.status === "in_progress").length

    return {
      statusCounts,
      occupancy,
      arrivals,
      arrivedToday,
      departures,
      departedToday,
      series,
      todayRevenue,
      periodRevenue: sumSeries(series, (point) => point.total),
      outstandingCount: outstanding.length,
      outstandingTotal,
      overdueTasks,
      openTasks,
      newOrders: data.orders.filter((order) => order.status === "new").length,
      unreadMessages: data.conversations.filter((conversation) => conversation.unread && !conversation.archived).length,
    }
  }, [data, today])

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting}, ${data.settings.profile.name.split(" ")[0]}`}
        description={`Here's how ${data.settings.hotel.name} is doing today.`}
      >
        <Button variant="outline" asChild>
          <Link href="/check-in-out">
            Front desk
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/bookings?new=1">
            <Plus aria-hidden="true" />
            New booking
          </Link>
        </Button>
      </PageHeader>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={formatPercent(summary.occupancy)}
          hint={`${summary.statusCounts.occupied} of ${data.rooms.length} rooms occupied`}
          icon={BedDouble}
          href="/rooms"
        />
        <StatCard
          label="Arrivals today"
          value={summary.arrivals.length}
          hint={`${summary.arrivedToday.length} already checked in`}
          icon={CalendarCheck}
          href="/check-in-out?tab=arrivals"
          tone="success"
        />
        <StatCard
          label="Departures due"
          value={summary.departures.length}
          hint={`${summary.departedToday.length} checked out today`}
          icon={CalendarX}
          href="/check-in-out?tab=departures"
          tone={summary.departures.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(summary.outstandingTotal)}
          hint={`${summary.outstandingCount} invoice${summary.outstandingCount === 1 ? "" : "s"} awaiting payment`}
          icon={Wallet}
          href="/billing?status=outstanding"
          tone={summary.outstandingTotal > 0 ? "danger" : "default"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueChart
          className="xl:col-span-2"
          series={summary.series}
          periodTotal={summary.periodRevenue}
          todayTotal={summary.todayRevenue}
          icon={IndianRupee}
        />
        <RoomStatusCard counts={summary.statusCounts} total={data.rooms.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <MovementsCard className="xl:col-span-2" arrivals={summary.arrivals} departures={summary.departures} />
        <AttentionCard
          overdueTasks={summary.overdueTasks}
          openTasks={summary.openTasks}
          newOrders={summary.newOrders}
          unreadMessages={summary.unreadMessages}
          outstandingCount={summary.outstandingCount}
        />
      </div>
    </div>
  )
}
