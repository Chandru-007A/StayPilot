"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Toggle dark mode">
      <Sun className="hidden dark:block" aria-hidden="true" />
      <Moon className="dark:hidden" aria-hidden="true" />
    </Button>
  )
}
