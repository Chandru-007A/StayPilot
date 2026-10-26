"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  /** Return `false` to keep the dialog open (e.g. on failure). */
  onConfirm: () => Promise<boolean | void> | boolean | void
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive, onConfirm }: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    setPending(true)
    try {
      const result = await onConfirm()
      if (result !== false) onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm leading-relaxed text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
