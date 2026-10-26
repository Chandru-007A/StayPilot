import { activeBookingForRoom } from "@/lib/calculations"
import type { FoodOrder, FoodOrderStatus, MenuItem } from "@/lib/types"
import { readData, writeData } from "./store"
import { assert, nextSequence, pushNotification, simulateLatency, uid } from "./utils"

const TRANSITIONS: Record<FoodOrderStatus, FoodOrderStatus[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

export function allowedOrderTransitions(status: FoodOrderStatus) {
  return TRANSITIONS[status]
}

export async function getFoodOrders() {
  await simulateLatency(0)
  return readData().orders
}

export async function createFoodOrder(input: { roomId: string; items: { menuItemId: string; quantity: number }[]; notes: string }) {
  await simulateLatency()
  let created: FoodOrder | undefined
  writeData((draft) => {
    const room = draft.rooms.find((item) => item.id === input.roomId)
    assert(room, "Select a room.")
    const stay = activeBookingForRoom(room.id, draft.bookings)
    assert(stay, `Room ${room.number} has no checked-in guest.`)
    assert(input.items.length > 0, "Add at least one menu item.")
    const items = input.items.map((line) => {
      const menuItem = draft.menu.find((item) => item.id === line.menuItemId)
      assert(menuItem, "A selected menu item no longer exists.")
      assert(menuItem.available, `${menuItem.name} is currently unavailable.`)
      assert(Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 20, "Quantities must be whole numbers from 1 to 20.")
      return { menuItemId: menuItem.id, name: menuItem.name, category: menuItem.category, quantity: line.quantity, unitPrice: menuItem.price }
    })
    const seq = nextSequence(draft.orders.map((order) => order.number), "RS-", 1001)
    const now = new Date().toISOString()
    created = { id: uid("o"), number: `RS-${seq}`, guestId: stay.guestId, roomId: room.id, items, notes: input.notes, status: "new", createdAt: now, updatedAt: now }
    draft.orders.unshift(created)
    pushNotification(draft, { kind: "food", title: "New room-service order", body: `${created.number} · Room ${room.number}`, href: "/food-delivery" })
  })
  return created as FoodOrder
}

export async function updateFoodOrder(id: string, status: FoodOrderStatus) {
  await simulateLatency()
  writeData((draft) => {
    const order = draft.orders.find((item) => item.id === id)
    assert(order, "Order not found.")
    assert(TRANSITIONS[order.status].includes(status), `An order that is ${order.status} cannot move to ${status}.`)
    order.status = status
    order.updatedAt = new Date().toISOString()
  })
}

export type MenuItemInput = Omit<MenuItem, "id">

export async function saveMenuItem(input: MenuItemInput, id?: string) {
  await simulateLatency()
  writeData((draft) => {
    const name = input.name.trim()
    assert(name.length >= 2, "Enter an item name.")
    assert(input.price > 0, "Price must be greater than zero.")
    assert(
      !draft.menu.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== id),
      "A menu item with this name already exists.",
    )
    if (id) {
      const item = draft.menu.find((entry) => entry.id === id)
      assert(item, "Menu item not found.")
      Object.assign(item, input, { name })
    } else {
      draft.menu.push({ ...input, name, id: uid("m") })
    }
  })
}

export async function toggleMenuAvailability(id: string) {
  await simulateLatency(150)
  writeData((draft) => {
    const item = draft.menu.find((entry) => entry.id === id)
    assert(item, "Menu item not found.")
    item.available = !item.available
  })
}
