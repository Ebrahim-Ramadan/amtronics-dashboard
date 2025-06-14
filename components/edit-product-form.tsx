"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTransition } from "react"
import { toast } from "sonner"
import { Product } from "@/app/products/page"

interface EditProductFormProps {
  product: Product
  onSuccess?: (updatedProduct: Product) => void
  onClose?: () => void
}

export function EditProductForm({ product, onSuccess, onClose }: EditProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<Product>(product)

  useEffect(() => {
    setFormData(product)
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "price" ||
        id === "quantity_on_hand" ||
        id === "barcode" ||
        id === "id" ||
        id === "sold_quantity" ||
        id === "visible_in_catalog" ||
        id === "visible_in_search" ||
        id === "discount"
          ? Number(value) // Convert to number for numeric fields
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic validation for required fields and price
    if (!formData.en_name.trim()) {
      toast.error("English Name is required.")
      return
    }
    if (!formData.ar_name.trim()) {
      toast.error("Arabic Name is required.")
      return
    }
    if (!formData.en_main_category.trim()) {
      toast.error("English Main Category is required.")
      return
    }
    if (!formData.ar_main_category.trim()) {
      toast.error("Arabic Main Category is required.")
      return
    }
    if (!formData.en_category.trim()) {
      toast.error("English Category is required.")
      return
    }
    if (!formData.ar_category.trim()) {
      toast.error("Arabic Category is required.")
      return
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Price must be a positive number.")
      return
    }
    if (!formData.quantity_on_hand || formData.quantity_on_hand <= 0) {
      toast.error("Quantity on Hand must be a positive number.")
      return
    }
    if (!formData.sold_quantity || formData.sold_quantity < 0) {
      toast.error("Sold Quantity must be a non-negative number.")
      return
    }
    if (!formData.slug_url.trim()) {
      toast.error("Slug URL is required.")
      return
    }
    if (formData.visible_in_catalog === undefined || formData.visible_in_catalog < 0) {
      toast.error("Visible in Catalog must be a non-negative number.")
      return
    }
    if (formData.visible_in_search === undefined || formData.visible_in_search < 0) {
      toast.error("Visible in Search must be a non-negative number.")
      return
    }
    if (formData.discount !== undefined && formData.discount > 100) {
      toast.error("Discount cannot be more than 100.")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const updatedProduct = formData;
          toast.success("Product updated successfully!")
          onSuccess?.(updatedProduct)
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Failed to update product.")
        }
      } catch (error) {
        console.error("Error updating product:", error)
        toast.error("An unexpected error occurred.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="id" className="text-right">ID</Label>
        <Input id="id" type="number" value={formData.id} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="barcode" className="text-right">Barcode</Label>
        <Input id="barcode" type="number" value={formData.barcode} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sku" className="text-right">SKU</Label>
        <Input id="sku" value={formData.sku} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_name" className="text-right">English Name</Label>
        <Input id="en_name" value={formData.en_name} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_name" className="text-right">Arabic Name</Label>
        <Input id="ar_name" value={formData.ar_name} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_description" className="text-right">English Description</Label>
        <Textarea id="en_description" value={formData.en_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_description" className="text-right">Arabic Description</Label>
        <Textarea id="ar_description" value={formData.ar_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_long_description" className="text-right">English Long Description</Label>
        <Textarea id="en_long_description" value={formData.en_long_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_long_description" className="text-right">Arabic Long Description</Label>
        <Textarea id="ar_long_description" value={formData.ar_long_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_main_category" className="text-right">English Main Category</Label>
        <Input id="en_main_category" value={formData.en_main_category} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_main_category" className="text-right">Arabic Main Category</Label>
        <Input id="ar_main_category" value={formData.ar_main_category} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_category" className="text-right">English Category</Label>
        <Input id="en_category" value={formData.en_category} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_category" className="text-right">Arabic Category</Label>
        <Input id="ar_category" value={formData.ar_category} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="price" className="text-right">Price</Label>
        <Input id="price" type="number" value={formData.price} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">Image URL</Label>
        <Input id="image" value={formData.image} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity_on_hand" className="text-right">Quantity on Hand</Label>
        <Input id="quantity_on_hand" type="number" value={formData.quantity_on_hand} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sold_quantity" className="text-right">Sold Quantity</Label>
        <Input id="sold_quantity" type="number" value={formData.sold_quantity} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="visible_in_catalog" className="text-right">Visible in Catalog</Label>
        <Input id="visible_in_catalog" type="number" value={formData.visible_in_catalog} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="visible_in_search" className="text-right">Visible in Search</Label>
        <Input id="visible_in_search" type="number" value={formData.visible_in_search} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="slug_url" className="text-right">Slug URL</Label>
        <Input id="slug_url" value={formData.slug_url} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discount" className="text-right">Discount (Optional)</Label>
        <Input id="discount" type="number" value={formData.discount || ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discount_type" className="text-right">Discount Type (Optional)</Label>
        <Input id="discount_type" value={formData.discount_type} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_brand" className="text-right">Arabic Brand (Optional)</Label>
        <Input id="ar_brand" value={formData.ar_brand} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_brand" className="text-right">English Brand (Optional)</Label>
        <Input id="en_brand" value={formData.en_brand} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating Product..." : "Update Product"}
      </Button>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
    </form>
  )
} 