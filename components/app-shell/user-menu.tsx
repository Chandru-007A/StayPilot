"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings, SlidersHorizontal, UserRound } from "lucide-react"
import { toast } from "sonner"
import { endDemoSession, type DemoSession } from "@/lib/session"
import { useHotelData } from "@/services/store"
import { initials } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu({ session }: { session: DemoSession }) {
  const router = useRouter()
  const data = useHotelData()
  const name = data?.settings.profile.name || session.name
  const role = data?.settings.profile.role || "Front office"

  const signOut = () => {
    endDemoSession()
    toast.success("Signed out")
    router.replace("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">{role}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{session.email}</span>
          <span className="mt-1 w-fit rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
            Demo session
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings?tab=account")}>
          <UserRound aria-hidden="true" />
          My profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings?tab=hotel")}>
          <Settings aria-hidden="true" />
          Hotel settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings?tab=appearance")}>
          <SlidersHorizontal aria-hidden="true" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
