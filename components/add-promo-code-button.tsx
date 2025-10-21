import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { AddPromoCodeForm } from "./add-promo-code-form"

interface AddPromoCodeButtonProps {
  onSuccess?: () => void
}

export function AddPromoCodeButton({ onSuccess }: AddPromoCodeButtonProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false) // Close the dialog on success
    onSuccess?.() // Call the parent's success handler
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Promo Code</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <AddPromoCodeForm onSuccess={handleSuccess} onClose={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
} 