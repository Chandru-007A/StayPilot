"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange storageKey="staypilot.theme">
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
