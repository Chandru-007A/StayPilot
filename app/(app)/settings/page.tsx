"use client"
import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { useHotel } from "@/services/store"
import { updateSettings } from "@/services/engagement-service"
export default function SettingsPage(){const d=useHotel();const [name,setName]=useState(d.settings.hotel.name);const [saved,setSaved]=useState(false);return <main className="max-w-2xl space-y-6"><PageHeader title="Settings" description="Configure hotel preferences and operations."/><section className="rounded-xl border bg-card p-6"><h2 className="font-semibold">Hotel profile</h2><label className="mt-5 block text-sm font-medium">Hotel name<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-10 w-full rounded-md border bg-background px-3"/></label><button onClick={async()=>{await updateSettings({ hotel: { ...d.settings.hotel, name } });setSaved(true)}} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save changes</button>{saved&&<p className="mt-3 text-sm text-emerald-600">Settings saved.</p>}</section></main>}
