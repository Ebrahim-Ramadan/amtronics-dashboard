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

// Predefined categories
export const categories = [
  "Kits",
  "Resistor",
  "Modules",
  "Sparkfun",
  "Transistor & Regulator",
  "Power Supply",
  "Accessories",
  "Switch",
  "Resistor & Potentiometer",
  "Diode",
  "Sensor",
  "DFRobot",
  "Keyestudio",
  "Servo & Stepper Motor",
  "Led & Diode",
  "Battery",
  "Transistor",
  "IC",
  "3D Print",
  "Capacitors",
  "Batteries & Power Supply",
  "Tools",
  "DC Motor & Pump",
  "Motor",
  "Arduino",
  "Filament",
  "Potentiometer",
  "Raspberry Pi",
  "Bread Board & PCB",
  "custom 3D"
]

export function AddProductForm({ onSuccess, onClose }: AddProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    en_name: "",
    ar_name: "",
    en_description: "",
    ar_description: "",
    en_long_description: "",
    ar_long_description: "",
    en_main_category: "",
    ar_main_category: "",
    en_category: "",
    ar_category: "",
    price: 0,
    image: "",
    quantity_on_hand: 0,
    barcode: 0, // Optional, will be auto-generated if not provided
    sku: "", // Optional, if you want to generate it server-side
    visible_in_catalog: 0,
    visible_in_search: 0,
    slug_url: "",
    discount: 0,
    discount_type: "",
    ar_brand: "",
    en_brand: "",
    is_3d: false,
    model_3d_url: "" as string | null,
  })

  const [selected3DFile, setSelected3DFile] = useState<File | null>(null)
  const [uploading3D, setUploading3D] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "price" ||
        id === "quantity_on_hand" ||
        id === "barcode" ||
        id === "visible_in_catalog" ||
        id === "visible_in_search" ||
        id === "discount"
          ? Number(value) // Convert to number for numeric fields
          : id === "is_3d"
          ? (e.target as HTMLInputElement).checked // Handle checkbox
          : value,
    }))

    // Auto-set 3D flag when 3D categories are selected
    if (id === "en_category" || id === "ar_category") {
      const is3DCategory = value === "3D Print" || value === "custom-3D"
      setFormData(prev => ({ ...prev, is_3d: is3DCategory }))
    }
  }

  const handle3DFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelected3DFile(file)
      // Clear the URL field when a new file is selected
      setFormData(prev => ({ ...prev, model_3d_url: "" }))
    }
  }

  const upload3DModel = async (): Promise<string | null> => {
    if (!selected3DFile) return null

    setUploading3D(true)
    try {
      const formData = new FormData()
      formData.append('file', selected3DFile)
      formData.append('productId', 'temp') // Will be updated after product creation

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
        // If 3D model is selected, upload it first
        let model3DUrl = formData.model_3d_url
        if (selected3DFile && formData.is_3d) {
          model3DUrl = await upload3DModel()
          if (!model3DUrl) {
            toast.error("Failed to upload 3D model. Please try again.")
            return
          }
        }

        const productData = {
          ...formData,
          model_3d_url: model3DUrl
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
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
    <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
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
        <select 
          id="en_main_category" 
          value={formData.en_main_category} 
          onChange={handleChange} 
          className="col-span-3 border rounded px-3 py-2" 
          required 
          disabled={isPending}
        >
          <option value="">Select Main Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ar_main_category" className="text-right">Arabic Main Category</Label>
        <select 
          id="ar_main_category" 
          value={formData.ar_main_category} 
          onChange={handleChange} 
          className="col-span-3 border rounded px-3 py-2" 
          required 
          disabled={isPending}
        >
          <option value="">Select Main Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="en_category" className="text-right">English Category</Label>
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
        <Label htmlFor="ar_category" className="text-right">Arabic Category</Label>
        <select 
          id="ar_category" 
          value={formData.ar_category} 
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
      
      {/* 3D Category Option - Auto-set when 3D categories are selected */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="is_3d" className="text-right">3D Product</Label>
        <div className="col-span-3 flex items-center gap-2">
          <input
            id="is_3d"
            type="checkbox"
            checked={formData.is_3d}
            onChange={handleChange}
            disabled={isPending}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-600">
            This is a 3D printable product 
            {formData.en_category === "3D Print" || formData.en_category === "custom-3D" && (
              <span className="text-blue-600 font-medium"> (Auto-detected from category)</span>
            )}
          </span>
        </div>
      </div>

      {/* 3D Model Upload */}
      {formData.is_3d && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="3d_file" className="text-right">3D Model File</Label>
            <div className="col-span-3">
              <Input
                id="3d_file"
                type="file"
                accept=".glb,.gltf,.obj,.fbx,.stl,.3ds,.dae"
                onChange={handle3DFileSelect}
                disabled={isPending || uploading3D}
                className="col-span-3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: GLB, GLTF, OBJ, FBX, STL, 3DS, DAE
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model_3d_url" className="text-right">3D Model URL</Label>
            <Input 
              id="model_3d_url" 
              value={formData.model_3d_url || ""} 
              onChange={handleChange} 
              placeholder="Or enter 3D model URL directly"
              className="col-span-3" 
              disabled={isPending} 
            />
          </div>
        </>
      )}

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
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="barcode" className="text-right">Barcode (Optional)</Label>
        <Input id="barcode" type="number" value={formData.barcode || ""} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="sku" className="text-right">SKU (Optional)</Label>
        <Input id="sku" value={formData.sku} onChange={handleChange} className="col-span-3" disabled={isPending} />
      </div>
      <Button type="submit" disabled={isPending || uploading3D}>
        {isPending ? "Adding Product..." : "Add Product"}
      </Button>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
    </form>
  )
} 