import type { Metadata } from "next"
import { Hotel } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the StayPilot hotel management demo.",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Hotel className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">Sign in to StayPilot</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">Front office, rooms, billing and guest services in one place.</p>
        </div>
      </div>
      <LoginForm />
      <p className="max-w-sm text-pretty text-center text-xs leading-relaxed text-muted-foreground">
        This is a demo prototype. Any email and a password of 8+ characters will sign you in. Passwords are never stored, and all data lives only in this browser.
      </p>
    </main>
  )
}
