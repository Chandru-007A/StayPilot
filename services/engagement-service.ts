import type { HotelSettings } from "@/lib/types"
import { resetStore, writeData } from "./store"
import { assert, simulateLatency, uid } from "./utils"

/* ---------- Messages (locally simulated — nothing is transmitted) ---------- */

export async function sendMessage(conversationId: string, body: string) {
  const text = body.trim()
  assert(text.length > 0, "Write a message before sending.")
  assert(text.length <= 1000, "Messages are limited to 1,000 characters.")
  await simulateLatency(300)
  writeData((draft) => {
    const conversation = draft.conversations.find((item) => item.id === conversationId)
    assert(conversation, "Conversation not found.")
    conversation.messages.push({ id: uid("msg"), sender: "staff", body: text, sentAt: new Date().toISOString(), simulated: true })
    conversation.unread = false
    conversation.archived = false
  })
}

export function setConversationRead(conversationId: string, read: boolean) {
  writeData((draft) => {
    const conversation = draft.conversations.find((item) => item.id === conversationId)
    if (conversation) conversation.unread = !read
  })
}

export async function setConversationArchived(conversationId: string, archived: boolean) {
  await simulateLatency(150)
  writeData((draft) => {
    const conversation = draft.conversations.find((item) => item.id === conversationId)
    assert(conversation, "Conversation not found.")
    conversation.archived = archived
  })
}

/* ---------- Reviews (no external platform is contacted) ---------- */

export async function saveReviewResponse(reviewId: string, body: string, state: "draft" | "saved") {
  const text = body.trim()
  assert(text.length >= 10, "Responses should be at least 10 characters.")
  await simulateLatency()
  writeData((draft) => {
    const review = draft.reviews.find((item) => item.id === reviewId)
    assert(review, "Review not found.")
    review.response = { body: text, state, updatedAt: new Date().toISOString() }
  })
}

export async function toggleReviewFlag(reviewId: string) {
  await simulateLatency(150)
  writeData((draft) => {
    const review = draft.reviews.find((item) => item.id === reviewId)
    assert(review, "Review not found.")
    review.flagged = !review.flagged
  })
}

/* ---------- Notifications ---------- */

export function markNotificationRead(id: string) {
  writeData((draft) => {
    const notification = draft.notifications.find((item) => item.id === id)
    if (notification) notification.read = true
  })
}

export function markAllNotificationsRead() {
  writeData((draft) => {
    for (const notification of draft.notifications) notification.read = true
  })
}

export function clearNotifications() {
  writeData((draft) => {
    draft.notifications = []
  })
}

/* ---------- Settings ---------- */

export async function updateSettings(patch: Partial<HotelSettings>) {
  await simulateLatency()
  writeData((draft) => {
    draft.settings = { ...draft.settings, ...patch }
  })
}

export async function resetDemoData() {
  await simulateLatency(300)
  resetStore()
}
