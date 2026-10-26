"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { useHotel } from "@/services/store"

export function GuestsView() {
  const data = useHotel(); const [query, setQuery] = useState("")
  const guests = useMemo(() => data.guests.filter((g) => `${g.name} ${g.email} ${g.city}`.toLowerCase().includes(query.toLowerCase())), [data.guests, query])
  return <main className="space-y-6"><PageHeader title="Guests" description="Guest directory and stay history." /><div className="flex items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input aria-label="Search guests" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, or city" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm" /></div><div className="text-sm text-muted-foreground">{guests.length} guests</div></div><div className="overflow-hidden rounded-xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Guest</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{guests.map((guest) => <tr key={guest.id} className="hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="size-4" /></span><div><div className="font-medium">{guest.name}</div><div className="text-xs text-muted-foreground">{guest.preferences || "No preferences noted"}</div></div></div></td><td className="px-5 py-4"><div>{guest.email}</div><div className="text-xs text-muted-foreground">{guest.phone}</div></td><td className="px-5 py-4 text-muted-foreground">{guest.city}</td><td className="px-5 py-4"><StatusBadge status={guest.status} /></td></tr>)}</tbody></table></div></main>
}
