"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startDemoSession, useDemoSession } from "@/lib/session"
import { titleCase } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean(),
})

type Values = z.infer<typeof schema>

const DEMO_EMAIL = "frontdesk@staypilot.example"

function nameFromEmail(email: string) {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim()
  return local ? titleCase(local) : "Staff member"
}

export function LoginForm() {
  const router = useRouter()
  const session = useDemoSession()
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  })

  useEffect(() => {
    if (session) router.replace("/dashboard")
  }, [session, router])

  const signIn = async (values: Values) => {
    setPending(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      startDemoSession(values.email.trim().toLowerCase(), nameFromEmail(values.email), values.remember)
      toast.success("Signed in to demo workspace")
      router.replace("/dashboard")
    } catch {
      toast.error("Your browser blocked storage, so the demo session could not start.")
      setPending(false)
    }
  }

  const useDemo = () => signIn({ email: DEMO_EMAIL, password: "demo-access", remember: true })

  const remember = watch("remember")

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(signIn)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@hotel.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <ForgotPasswordDialog />
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setValue("remember", checked === true)} />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Keep me signed in on this device
            </Label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Sign in
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" onClick={useDemo} disabled={pending}>
            Continue with demo account
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ForgotPasswordDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Password reset</DialogTitle>
          <DialogDescription className="leading-relaxed">
            StayPilot is running in demo mode, so there are no real accounts and no reset emails are sent. Sign in with any email and a password of at least 8 characters, or use the demo account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button>Got it</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
