"use client"
import { Star } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { useHotel } from "@/services/store"
import { toggleReviewFlag } from "@/services/engagement-service"
export function ReviewsView(){const data=useHotel();return <main className="space-y-6"><PageHeader title="Reviews" description="Monitor guest feedback and follow-ups."/><div className="grid gap-4 md:grid-cols-2">{data.reviews.map(r=><article key={r.id} className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between"><div><div className="font-semibold">{r.reviewerName}</div><div className="mt-1 flex text-amber-500">{Array.from({length:5},(_,i)=><Star key={i} className={`size-4 ${i<r.rating?"fill-current":""}`}/>)}</div></div><button onClick={()=>toggleReviewFlag(r.id)} className={`rounded-md border px-2 py-1 text-xs ${r.flagged?"border-destructive text-destructive":""}`}>{r.flagged?"Flagged":"Flag"}</button></div><h2 className="mt-4 font-medium">{r.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{r.body}</p><div className="mt-4 text-xs text-muted-foreground">{r.channel} · {r.date}</div></article>)}</div></main>}
