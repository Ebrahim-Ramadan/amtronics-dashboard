import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AddPromoCodeFormProps {
  onSuccess?: () => void
  onClose?: () => void
}

export function AddPromoCodeForm({ onSuccess, onClose }: AddPromoCodeFormProps) {
  const [code, setCode] = useState("")
  const [percentage, setPercentage] = useState<number | string>("")
  const [expiry, setExpiry] = useState("")
  const [active, setActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (!code || percentage === "" || !expiry) {
      toast.error("Please fill in all required fields.")
      setIsLoading(false)
      return
    }

    const percentageNumber = Number(percentage)
    console.log('percentageNumber', percentageNumber)
    
    if (isNaN(percentageNumber) || percentageNumber < 0 || percentageNumber > 100) {
      toast.error("Percentage must be a number between 0 and 100.")
      setIsLoading(false)
      return
    }

    const expiryDate = new Date(expiry)
    const today = new Date()
    today.setHours(0, 0, 0, 0); // Reset time to compare just dates

    if (expiryDate < today) {
      toast.error("Expiry date cannot be in the past.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/promocodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          percentage: percentageNumber,
          expiry: expiryDate.toISOString(), // Use the validated date
          active,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Promo code added successfully!")
        setCode("")
        setPercentage("")
        setExpiry("")
        setActive(true)
        onSuccess?.()
        onClose?.()
      } else {
        toast.error(result.message || "Failed to add promo code.")
      }
    } catch (error) {
      console.error("Error adding promo code:", error)
      toast.error("An unexpected error occurred.")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="code">Promo Code</Label>
        <Input
          id="code"
          placeholder="SUMMER20"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="percentage">Discount Percentage</Label>
        <Input
          id="percentage"
          type="number"
          placeholder="20"
          required
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expiry">Expiry Date</Label>
        <Input
          id="expiry"
          type="date"
          required
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
      </div>
      {/* TODO: Add a checkbox for active status if needed, default to true for now */}
      {/* <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <Label htmlFor="active">Active</Label>
      </div> */}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Promo Code"}
      </Button>
    </form>
  )
} 