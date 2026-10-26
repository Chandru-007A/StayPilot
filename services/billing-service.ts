import { invoiceTotals } from "@/lib/calculations"
import type { Invoice, InvoiceLineItem, PaymentMethod } from "@/lib/types"
import { readData, writeData } from "./store"
import { assert, nextSequence, pushNotification, simulateLatency, uid } from "./utils"

export interface InvoiceInput {
  guestId: string
  bookingId: string | null
  issueDate: string
  dueDate: string
  taxRate: number
  notes: string
  lineItems: Omit<InvoiceLineItem, "id">[]
}

function validateLines(lines: Omit<InvoiceLineItem, "id">[]) {
  assert(lines.length > 0, "Add at least one line item.")
  for (const line of lines) {
    assert(line.description.trim().length > 0, "Every line item needs a description.")
    assert(line.quantity > 0, "Line item quantities must be greater than zero.")
    assert(line.unitPrice >= 0, "Line item prices cannot be negative.")
  }
}

export async function getInvoices() {
  await simulateLatency(0)
  return readData().invoices
}

export async function createInvoice(input: InvoiceInput, finalize: boolean) {
  await simulateLatency()
  let created: Invoice | undefined
  writeData((draft) => {
    assert(draft.guests.some((guest) => guest.id === input.guestId), "Select a guest.")
    assert(input.dueDate >= input.issueDate, "Due date cannot be before the issue date.")
    assert(input.taxRate >= 0 && input.taxRate <= 28, "Tax rate must be between 0% and 28%.")
    validateLines(input.lineItems)
    if (input.bookingId) {
      const booking = draft.bookings.find((item) => item.id === input.bookingId)
      assert(booking, "Linked booking not found.")
      assert(booking.guestId === input.guestId, "The linked booking belongs to a different guest.")
      const existing = draft.invoices.find((item) => item.id === booking.invoiceId && !item.voided)
      assert(!existing, `Booking ${booking.reference} already has invoice ${existing?.number}.`)
    }
    const seq = nextSequence(draft.invoices.map((inv) => inv.number.split("-").at(-1) ?? ""), "", 1)
    const id = uid("inv")
    created = {
      id,
      number: `INV-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`,
      guestId: input.guestId,
      bookingId: input.bookingId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      taxRate: input.taxRate,
      notes: input.notes,
      lineItems: input.lineItems.map((line) => ({ ...line, id: uid("li") })),
      payments: [],
      finalized: finalize,
      voided: false,
    }
    draft.invoices.push(created)
    if (input.bookingId) {
      const booking = draft.bookings.find((item) => item.id === input.bookingId)
      if (booking) booking.invoiceId = id
    }
  })
  return created as Invoice
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  await simulateLatency()
  writeData((draft) => {
    const invoice = draft.invoices.find((item) => item.id === id)
    assert(invoice, "Invoice not found.")
    assert(!invoice.voided, "Void invoices cannot be edited.")
    assert(input.dueDate >= input.issueDate, "Due date cannot be before the issue date.")
    invoice.notes = input.notes
    invoice.dueDate = input.dueDate
    if (!invoice.finalized) {
      validateLines(input.lineItems)
      assert(input.taxRate >= 0 && input.taxRate <= 28, "Tax rate must be between 0% and 28%.")
      invoice.issueDate = input.issueDate
      invoice.taxRate = input.taxRate
      invoice.lineItems = input.lineItems.map((line, index) => ({
        ...line,
        id: invoice.lineItems[index]?.id ?? uid("li"),
      }))
      const { total, paid } = invoiceTotals(invoice)
      assert(total >= paid, "Invoice total cannot be lower than the amount already paid.")
    }
  })
}

export async function finalizeInvoice(id: string) {
  await simulateLatency()
  writeData((draft) => {
    const invoice = draft.invoices.find((item) => item.id === id)
    assert(invoice && !invoice.voided, "Invoice not found.")
    validateLines(invoice.lineItems)
    invoice.finalized = true
  })
}

export async function recordPayment(id: string, amount: number, method: PaymentMethod, note: string) {
  await simulateLatency(400)
  writeData((draft) => {
    const invoice = draft.invoices.find((item) => item.id === id)
    assert(invoice, "Invoice not found.")
    assert(!invoice.voided, "Payments cannot be recorded on a void invoice.")
    const { balance } = invoiceTotals(invoice)
    assert(amount > 0, "Payment amount must be greater than zero.")
    assert(amount <= balance + 0.001, `Payment cannot exceed the balance due.`)
    invoice.payments.push({ id: uid("p"), amount: Math.round(amount * 100) / 100, method, date: new Date().toISOString(), note: note || "Simulated payment" })
    pushNotification(draft, { kind: "payment", title: "Payment recorded (simulated)", body: `${invoice.number} · ₹${amount.toLocaleString("en-IN")}`, href: `/billing?view=${invoice.id}` })
  })
}

export async function voidInvoice(id: string) {
  await simulateLatency()
  writeData((draft) => {
    const invoice = draft.invoices.find((item) => item.id === id)
    assert(invoice, "Invoice not found.")
    assert(invoice.payments.length === 0, "Invoices with recorded payments cannot be voided.")
    invoice.voided = true
  })
}
