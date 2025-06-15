"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditProductButton } from "@/components/edit-product-button"
import { Product } from "@/app/products/page"

interface ProductDisplayProps {
  initialProduct: Product | null
}

export function ProductDisplay({ initialProduct }: ProductDisplayProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [isDeleting, startDeleteTransition] = useTransition()

  useEffect(() => {
    setProduct(initialProduct)
  }, [initialProduct])

  const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct) // Update local state directly
    toast.success("Product updated successfully!")
  }

  const handleDelete = async (id: string) => {
    startDeleteTransition(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          toast.success("Product deleted successfully!")
          // Redirect to the products page without any search params
          router.push("/products")
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Failed to delete product.")
        }
      } catch (error) {
        console.error("Error deleting product:", error)
        toast.error("An unexpected error occurred.")
      }
    })
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-lg font-medium text-gray-900">No product found with that criteria.</p>
            <p className="text-sm text-gray-500">Please try a different search term.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Details</CardTitle>
        <div className="flex gap-2">
          <EditProductButton product={product} onSuccess={handleProductUpdate} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Trash2 className="h-4 w-4" />)}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the product.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(product._id)} disabled={isDeleting}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div><strong>Databse ID:</strong> {product._id}</div>
        <div>ID: {product.id}</div>
        <div><strong>Barcode:</strong> {product.barcode}</div>
        <div><strong>SKU:</strong> {product.sku}</div>
        <div><strong>English Name:</strong> {product.en_name}</div>
        <div><strong>Arabic Name:</strong> {product.ar_name}</div>
        <div><strong>Price:</strong> KD {product.price.toFixed(2)}</div>
        <div><strong>Quantity on Hand:</strong> {product.quantity_on_hand}</div>
        <div><strong>Sold Quantity:</strong> {product.sold_quantity}</div>
        {product.image && (
          <div>
            <strong>Image:</strong>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image.split(',')[0]} alt={product.en_name} className="mt-2 w-32 h-32 object-cover" />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 