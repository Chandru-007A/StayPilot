import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns"
import type { DateString } from "./types"

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 })

export function formatCurrency(amount: number, precise = false) {
  return (precise ? inrPrecise : inr).format(Number.isFinite(amount) ? amount : 0)
}

export function formatCompactCurrency(amount: number) {
  return `₹${compact.format(amount)}`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value)
}

export function formatPercent(value: number, digits = 0) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`
}

export function toDateString(date: Date): DateString {
  return format(date, "yyyy-MM-dd")
}

export function todayString(): DateString {
  return toDateString(new Date())
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return format(parseISO(value), "dd MMM yyyy")
}

export function formatShortDate(value: string) {
  return format(parseISO(value), "dd MMM")
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  return format(parseISO(value), "dd MMM yyyy, h:mm a")
}

export function formatTime(value: string) {
  return format(parseISO(value), "h:mm a")
}

export function formatRelative(value: string) {
  return `${formatDistanceToNowStrict(parseISO(value))} ago`
}

export function nightsBetween(checkIn: DateString, checkOut: DateString) {
  if (!checkIn || !checkOut) return 0
  return Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)))
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}
