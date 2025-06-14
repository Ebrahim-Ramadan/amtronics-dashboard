"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EditProductForm } from "@/components/edit-product-form"
import { Product } from "@/app/products/page"

interface EditProductButtonProps {
  product: Product
  onSuccess?: (updatedProduct: Product) => void
}

export function EditProductButton({ product, onSuccess }: EditProductButtonProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (updatedProduct: Product) => {
    setOpen(false)
    onSuccess?.(updatedProduct)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <EditProductForm product={product} onSuccess={handleSuccess} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
} 