"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Loader2 } from "lucide-react"
import { Product } from "@/app/products/page"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface ProductsTableProps {
  products: Product[]
  onProductDeleted?: () => void
}

export function ProductsTable({ products, onProductDeleted }: ProductsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
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
        onProductDeleted?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to delete product.")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>English Name</TableHead>
            <TableHead>Arabic Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity on Hand</TableHead>
            <TableHead>Sold Quantity</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">{product.id}</TableCell>
                <TableCell>{product.barcode}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.en_name}</TableCell>
                <TableCell>{product.ar_name}</TableCell>
                <TableCell>KD{product.price.toFixed(2)}</TableCell>
                <TableCell>{product.quantity_on_hand}</TableCell>
                <TableCell>{product.sold_quantity}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
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
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product._id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 