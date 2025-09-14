"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useTransition } from "react"
import { toast } from "sonner"
import { Product } from "@/app/products/page"
import { categories } from "./add-product-form"

interface EditProductFormProps {
  product: Product
  onSuccess?: (updatedProduct: Product) => void
  onClose?: () => void
}

export function EditProductForm({ product, onSuccess, onClose }: EditProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<Product>(product)
  const [selected3DFile, setSelected3DFile] = useState<File | null>(null)
  const [uploading3D, setUploading3D] = useState(false)

  useEffect(() => {
    setFormData(product)
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "price" ||
        id === "quantity_on_hand" ||
        id === "id" ||
        id === "sold_quantity" ||
        id === "discount" ||
        id === "ave_cost" ||
        id === "enable_quantity_in_store"
          ? Number(value)
          : id === "is_3d" || id === "is_soldering"
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handle3DFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelected3DFile(file)
      setFormData(prev => ({ ...prev, model_3d_url: "" }))
    }
  }

  const upload3DModel = async (): Promise<string | null> => {
    if (!selected3DFile) return null

    setUploading3D(true)
    try {
      const formData = new FormData()
      formData.append('file', selected3DFile)
      formData.append('productId', product._id || 'temp')

      const response = await fetch('/api/products/3d-upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to upload 3D model')
        return null
      }
    } catch (error) {
      console.error('3D upload error:', error)
      toast.error('Failed to upload 3D model')
      return null
    } finally {
      setUploading3D(false)
    }
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
    if (!formData.en_category.trim()) {
      toast.error("English Category is required.")
      return
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Price must be a positive number.")
      return
    }
    if (formData.quantity_on_hand === undefined || formData.quantity_on_hand === null) {
      toast.error("Quantity on Hand is required.")
      return
    }
    if (formData.sold_quantity === undefined || formData.sold_quantity < 0) {
      toast.error("Sold Quantity must be a non-negative number.")
      return
    }
    // if (formData.visible_in_catalog === undefined || formData.visible_in_catalog < 0) { // removed
    //   toast.error("Visible in Catalog must be a non-negative number.")
    //   return
    // }
    // if (formData.visible_in_search === undefined || formData.visible_in_search < 0) { // removed
    //   toast.error("Visible in Search must be a non-negative number.")
    //   return
    // }
    if (formData.discount !== undefined && formData.discount > 100) {
      toast.error("Discount cannot be more than 100.")
      return
    }

    startTransition(async () => {
      try {
        // If 3D model is selected, upload it first
        let model3DUrl: string | undefined = formData.model_3d_url || undefined
        if (selected3DFile && formData.is_3d) {
          const uploadedUrl = await upload3DModel()
          if (!uploadedUrl) {
            toast.error("Failed to upload 3D model. Please try again.")
            return
          }
          model3DUrl = uploadedUrl
        }

        const productData = {
          ...formData,
          model_3d_url: model3DUrl
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          const updatedProduct = { ...formData, model_3d_url: model3DUrl || undefined };
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
        <Label htmlFor="id" className="">ID</Label>
        <Input id="id" type="number" value={formData.id} onChange={handleChange} className="col-span-3" required disabled />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sku" className="">SKU</Label>
        <Input id="sku" value={formData.sku} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_name" className="">English Name</Label>
        <Input id="en_name" value={formData.en_name} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_name" className="">Arabic Name</Label>
        <Input id="ar_name" value={formData.ar_name} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      {/* <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_description" className="">English Description</Label>
        <Textarea id="en_description" value={formData.en_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div> */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_long_description" className="">English Long Description</Label>
        <Textarea id="en_long_description" value={formData.en_long_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_long_description" className="">Arabic Long Description</Label>
        <Textarea id="ar_long_description" value={formData.ar_long_description} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_category" className="">English Category</Label>
        <select 
          id="en_category" 
          value={formData.en_category} 
          onChange={handleChange} 
          className="col-span-3 border rounded px-3 py-2" 
          required 
          disabled={isPending}
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="price" className="">Price</Label>
        <Input id="price" type="number" value={formData.price} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="">Image URL</Label>
        <Input id="image" value={formData.image} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quantity_on_hand" className="">Quantity on Hand</Label>
        <Input id="quantity_on_hand" type="number" value={formData.quantity_on_hand ?? ""} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sold_quantity" className="">Sold Quantity</Label>
        <Input id="sold_quantity" type="number" value={formData.sold_quantity} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      {/* <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="visible_in_catalog" className="">Visible in Catalog</Label>
        <Input id="visible_in_catalog" type="number" value={formData.visible_in_catalog} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="visible_in_search" className="">Visible in Search</Label>
        <Input id="visible_in_search" type="number" value={formData.visible_in_search} onChange={handleChange} className="col-span-3" required disabled={isPending} />
      </div> */}
      {/* Optional fields */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discount" className="">Discount (Optional)</Label>
        <Input id="discount" type="number" value={formData.discount ?? ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="is_3d" className="">3D Product</Label>
        <input
          id="is_3d"
          type="checkbox"
          checked={formData.is_3d || false}
          onChange={handleChange}
          disabled={isPending}
          className="h-4 w-4"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="model_3d_url" className="">3D Model URL</Label>
        <Input
          id="model_3d_url"
          value={formData.model_3d_url || ""}
          onChange={handleChange}
          className="col-span-3"
          disabled={isPending}
        />
      </div>
      {/* <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sell_this" className="">Sell This (Optional)</Label>
        <Input id="sell_this" type="number" value={formData.sell_this ?? ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="buy_this" className="">Buy This (Optional)</Label>
        <Input id="buy_this" type="number" value={formData.buy_this ?? ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div> */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ave_cost" className="">Average Cost (Optional)</Label>
        <Input id="ave_cost" type="number" value={formData.ave_cost ?? ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="enable_quantity_in_store" className="">Enable Quantity In Store (Optional)</Label>
        <Input id="enable_quantity_in_store" type="number" value={formData.enable_quantity_in_store ?? ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="is_soldering" className="">For Soldering</Label>
        <input
          id="is_soldering"
          type="checkbox"
          checked={formData.is_soldering || false}
          onChange={handleChange}
          disabled={isPending}
          className="h-4 w-4"
        />
      </div>
      <Button type="submit" disabled={isPending || uploading3D}>
        {isPending ? "Updating Product..." : "Update Product"}
      </Button>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
    </form>
  )
}