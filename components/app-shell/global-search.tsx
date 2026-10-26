"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BedDouble, CalendarDays, Receipt, Search, User } from "lucide-react"
import { useHotelData } from "@/services/store"
import { NAV_ITEMS } from "@/lib/navigation"
import { formatShortDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const MAX_PER_GROUP = 6

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const data = useHotelData()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!data || term.length < 1) return null
    const guestName = new Map(data.guests.map((guest) => [guest.id, guest.name]))
    const roomNumber = new Map(data.rooms.map((room) => [room.id, room.number]))
    const match = (...values: string[]) => values.some((value) => value.toLowerCase().includes(term))
    return {
      guests: data.guests.filter((guest) => match(guest.name, guest.email, guest.phone)).slice(0, MAX_PER_GROUP),
      bookings: data.bookings
        .filter((booking) => match(booking.reference, guestName.get(booking.guestId) ?? "", roomNumber.get(booking.roomId) ?? ""))
        .slice(0, MAX_PER_GROUP)
        .map((booking) => ({ ...booking, guestName: guestName.get(booking.guestId) ?? "Unknown guest", room: roomNumber.get(booking.roomId) ?? "—" })),
      rooms: data.rooms.filter((room) => match(room.number, room.type)).slice(0, MAX_PER_GROUP),
      invoices: data.invoices
        .filter((invoice) => match(invoice.number, guestName.get(invoice.guestId) ?? ""))
        .slice(0, MAX_PER_GROUP)
        .map((invoice) => ({ ...invoice, guestName: guestName.get(invoice.guestId) ?? "Unknown guest" })),
    }
  }, [data, query])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-9 justify-start gap-2 px-0 text-muted-foreground sm:w-56 sm:px-3 md:w-64"
        aria-label="Search guests, bookings, rooms and invoices"
      >
        <Search className="mx-auto sm:mx-0" aria-hidden="true" />
        <span className="hidden flex-1 text-left text-sm font-normal sm:inline">Search…</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search by guest, phone, email, booking ref, room or invoice…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No matching records.</CommandEmpty>
          {!results && (
            <CommandGroup heading="Go to">
              {NAV_ITEMS.map((item) => (
                <CommandItem key={item.href} value={`nav ${item.label}`} onSelect={() => go(item.href)}>
                  <item.icon aria-hidden="true" />
                  {item.label}
                  <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.guests.length > 0 && (
            <CommandGroup heading="Guests">
              {results.guests.map((guest) => (
                <CommandItem key={guest.id} value={`guest ${guest.id} ${guest.name} ${guest.email} ${guest.phone}`} onSelect={() => go(`/guests?view=${guest.id}`)}>
                  <User aria-hidden="true" />
                  <span className="truncate">{guest.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{guest.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.bookings.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Bookings">
                {results.bookings.map((booking) => (
                  <CommandItem key={booking.id} value={`booking ${booking.id} ${booking.reference} ${booking.guestName} ${booking.room}`} onSelect={() => go(`/bookings?view=${booking.id}`)}>
                    <CalendarDays aria-hidden="true" />
                    <span className="font-mono text-xs">{booking.reference}</span>
                    <span className="truncate">{booking.guestName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Room {booking.room} · {formatShortDate(booking.checkIn)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {results && results.rooms.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Rooms">
                {results.rooms.map((room) => (
                  <CommandItem key={room.id} value={`room ${room.id} ${room.number} ${room.type}`} onSelect={() => go(`/rooms?view=${room.id}`)}>
                    <BedDouble aria-hidden="true" />
                    Room {room.number}
                    <span className="ml-auto text-xs text-muted-foreground">{room.type}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {results && results.invoices.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Invoices">
                {results.invoices.map((invoice) => (
                  <CommandItem key={invoice.id} value={`invoice ${invoice.id} ${invoice.number} ${invoice.guestName}`} onSelect={() => go(`/billing?view=${invoice.id}`)}>
                    <Receipt aria-hidden="true" />
                    <span className="font-mono text-xs">{invoice.number}</span>
                    <span className="truncate">{invoice.guestName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
