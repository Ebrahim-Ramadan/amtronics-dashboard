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
  const [type, setType] = useState<"percentage" | "fixed">("percentage")
  const [value, setValue] = useState<string>("")
  const [expiry, setExpiry] = useState("")
  const [active, setActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (code.trim() === '' || value === "" || !expiry) {
      toast.error("Please fill in all required fields.")
      setIsLoading(false)
      return
    }

    const valueNumber = Number(value)
    if (isNaN(valueNumber) || valueNumber <= 0) {
      toast.error("Discount value must be a positive number.")
      setIsLoading(false)
      return
    }
    if (type === "percentage" && (valueNumber < 1 || valueNumber > 100)) {
      toast.error("Percentage must be between 1 and 100.")
      setIsLoading(false)
      return
    }

    const expiryDate = new Date(expiry)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
          type,
          value: valueNumber,
          expiry: expiryDate.toISOString(),
          active,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Promo code added successfully!")
        setCode("")
        setType("percentage")
        setValue("")
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
        <Label htmlFor="type">Discount Type</Label>
        <select
          id="type"
          value={type}
          onChange={e => setType(e.target.value as "percentage" | "fixed")}
          className="border rounded px-2 py-1 w-full"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="value">
          {type === "percentage" ? "Discount Percentage (%)" : "Discount Amount"}
        </Label>
        <Input
          id="value"
          type="number"
          step="any" // <-- Add this line
          placeholder={type === "percentage" ? "20" : "5"}
          required
          min={type === "percentage" ? "1" : "0.01"}
          max={type === "percentage" ? "100" : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Promo Code"}
      </Button>
    </form>
  )
}