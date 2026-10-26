import type { HotelData, HousekeepingState, HousekeepingTask, Room, TaskStatus } from "@/lib/types"
import { readData, writeData } from "./store"
import { assert, pushNotification, simulateLatency, uid } from "./utils"

export type RoomInput = Omit<Room, "id" | "housekeeping" | "maintenance" | "maintenanceNote">

function validateRoom(data: HotelData, input: RoomInput, excludeId?: string) {
  const number = input.number.trim()
  assert(/^[0-9A-Za-z-]{1,6}$/.test(number), "Room number must be 1–6 letters or digits.")
  assert(
    !data.rooms.some((room) => room.number.toLowerCase() === number.toLowerCase() && room.id !== excludeId),
    `Room ${number} already exists.`,
  )
  assert(input.capacity >= 1 && input.capacity <= 8, "Capacity must be between 1 and 8.")
  assert(input.pricePerNight > 0, "Price per night must be greater than zero.")
  return number
}

export async function getRooms() {
  await simulateLatency(0)
  return readData().rooms
}

export async function createRoom(input: RoomInput) {
  await simulateLatency()
  writeData((draft) => {
    const number = validateRoom(draft, input)
    draft.rooms.push({ ...input, number, id: uid("r"), housekeeping: "clean", maintenance: false, maintenanceNote: "" })
    draft.rooms.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
  })
}

export async function updateRoom(id: string, input: RoomInput) {
  await simulateLatency()
  writeData((draft) => {
    const room = draft.rooms.find((item) => item.id === id)
    assert(room, "Room not found.")
    const number = validateRoom(draft, input, id)
    Object.assign(room, input, { number })
  })
}

export async function setRoomMaintenance(id: string, maintenance: boolean, note: string) {
  await simulateLatency()
  writeData((draft) => {
    const room = draft.rooms.find((item) => item.id === id)
    assert(room, "Room not found.")
    if (maintenance) assert(note.trim().length >= 3, "Describe the maintenance issue.")
    room.maintenance = maintenance
    room.maintenanceNote = maintenance ? note.trim() : ""
  })
}

export async function setRoomHousekeeping(id: string, housekeeping: HousekeepingState) {
  await simulateLatency()
  writeData((draft) => {
    const room = draft.rooms.find((item) => item.id === id)
    assert(room, "Room not found.")
    room.housekeeping = housekeeping
  })
}

/* ---------- Housekeeping tasks ---------- */

const CLEANING_TYPES = new Set(["Checkout clean", "Deep clean"])

export type TaskInput = Pick<
  HousekeepingTask,
  "roomId" | "category" | "type" | "priority" | "staffId" | "dueAt" | "notes" | "blocksRoom"
>

function applyRoomEffects(draft: HotelData, task: HousekeepingTask) {
  const room = draft.rooms.find((item) => item.id === task.roomId)
  if (!room) return
  const openTasks = draft.tasks.filter(
    (item) => item.roomId === room.id && item.id !== task.id && (item.status === "pending" || item.status === "in_progress"),
  )
  if (task.category === "housekeeping") {
    if (task.status === "in_progress") room.housekeeping = "cleaning"
    if (task.status === "pending" && CLEANING_TYPES.has(task.type) && room.housekeeping === "clean") room.housekeeping = "dirty"
    if (task.status === "completed" && !openTasks.some((item) => item.category === "housekeeping" && CLEANING_TYPES.has(item.type))) {
      room.housekeeping = "clean"
    }
  }
  if (task.category === "maintenance" && task.blocksRoom) {
    if (task.status === "pending" || task.status === "in_progress") {
      room.maintenance = true
      room.maintenanceNote = task.notes || task.type
    } else if (!openTasks.some((item) => item.category === "maintenance" && item.blocksRoom)) {
      room.maintenance = false
      room.maintenanceNote = ""
    }
  }
}

export async function createTask(input: TaskInput) {
  await simulateLatency()
  writeData((draft) => {
    assert(draft.rooms.some((room) => room.id === input.roomId), "Select a room.")
    assert(!Number.isNaN(Date.parse(input.dueAt)), "Enter a valid due time.")
    const task: HousekeepingTask = {
      ...input,
      id: uid("t"),
      status: "pending",
      completionNotes: "",
      createdAt: new Date().toISOString(),
      completedAt: null,
    }
    draft.tasks.unshift(task)
    applyRoomEffects(draft, task)
    if (input.priority === "urgent") {
      const room = draft.rooms.find((item) => item.id === input.roomId)
      pushNotification(draft, { kind: "housekeeping", title: "Urgent task created", body: `${input.type} · Room ${room?.number}`, href: "/housekeeping" })
    }
  })
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<HousekeepingTask, "staffId" | "priority" | "dueAt" | "notes">> & { status?: TaskStatus; completionNotes?: string },
) {
  await simulateLatency()
  writeData((draft) => {
    const task = draft.tasks.find((item) => item.id === id)
    assert(task, "Task not found.")
    if (patch.status && patch.status !== task.status) {
      assert(task.status !== "completed" && task.status !== "cancelled", "Closed tasks cannot be reopened.")
    }
    Object.assign(task, patch)
    if (patch.status === "completed") task.completedAt = new Date().toISOString()
    applyRoomEffects(draft, task)
  })
}
