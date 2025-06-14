"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTransition } from "react"
import { toast } from "sonner"

interface AddProductFormProps {
  onSuccess?: () => void
  onClose?: () => void
}

export function AddProductForm({ onSuccess, onClose }: AddProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    en_name: "",
    ar_name: "",
    en_description: "",
    ar_description: "",
    price: 0,
    image: "",
    quantity_on_hand: 0,
    barcode: 0, // Optional, will be auto-generated if not provided
    sku: "", // Optional, if you want to generate it server-side
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "price" || id === "quantity_on_hand" || id === "barcode" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success("Product added successfully!")
          onSuccess?.()
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Failed to add product.")
        }
      } catch (error) {
        console.error("Error adding product:", error)
        toast.error("An unexpected error occurred.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_name" className="text-right">English Name</Label>
        <Input id="en_name" value={formData.en_name} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_name" className="text-right">Arabic Name</Label>
        <Input id="ar_name" value={formData.ar_name} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_description" className="text-right">English Description</Label>
        <Textarea id="en_description" value={formData.en_description} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_description" className="text-right">Arabic Description</Label>
        <Textarea id="ar_description" value={formData.ar_description} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="price" className="text-right">Price</Label>
        <Input id="price" type="number" value={formData.price} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">Image URL</Label>
        <Input id="image" value={formData.image} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity_on_hand" className="text-right">Quantity on Hand</Label>
        <Input id="quantity_on_hand" type="number" value={formData.quantity_on_hand} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="barcode" className="text-right">Barcode (Optional)</Label>
        <Input id="barcode" type="number" value={formData.barcode || ""} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sku" className="text-right">SKU (Optional)</Label>
        <Input id="sku" value={formData.sku} onChange={handleChange} className="col-span-3" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding Product..." : "Add Product"}
      </Button>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
    </form>
  )
} 