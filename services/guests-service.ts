import type { Guest } from "@/lib/types"
import { readData, writeData } from "./store"
import { assert, simulateLatency, uid } from "./utils"

export type GuestInput = Omit<Guest, "id" | "createdAt">

export async function getGuests() {
  await simulateLatency(0)
  return readData().guests
}

export async function createGuest(input: GuestInput) {
  await simulateLatency()
  let created: Guest | undefined
  writeData((draft) => {
    const email = input.email.trim().toLowerCase()
    assert(!draft.guests.some((guest) => guest.email.toLowerCase() === email), "A guest with this email already exists.")
    created = { ...input, email, id: uid("g"), createdAt: new Date().toISOString() }
    draft.guests.push(created)
  })
  return created as Guest
}

export async function updateGuest(id: string, input: GuestInput) {
  await simulateLatency()
  writeData((draft) => {
    const guest = draft.guests.find((item) => item.id === id)
    assert(guest, "Guest not found.")
    const email = input.email.trim().toLowerCase()
    assert(
      !draft.guests.some((item) => item.email.toLowerCase() === email && item.id !== id),
      "Another guest already uses this email.",
    )
    Object.assign(guest, input, { email })
  })
}
