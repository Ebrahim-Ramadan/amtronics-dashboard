"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Cuboid, Edit } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditProductButton } from "@/components/edit-product-button"
import { Product } from "@/app/products/page"
import Link from "next/link"
import { AddVarietyForm } from "@/components/add-variety-form" // Import the AddVarietyForm

interface ProductDisplayProps {
  initialProduct: Product | null
}

export function ProductDisplay({ initialProduct }: ProductDisplayProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isAddingVariety, setIsAddingVariety] = useState(false) // State to control the variety form visibility
  const [editingVariety, setEditingVariety] = useState<{ index: number; variety: any } | null>(null) // State for editing variety

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

  const handleDeleteVariety = async (varietyIndex: number) => {
    const varietyToDelete = product?.varieties[varietyIndex];
    if (!varietyToDelete) return;

    // Update the product in the database
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/varieties`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product._id,
          variety_index: varietyIndex,
        }),
      });

      if (response.ok) {
        const updatedVarieties = product.varieties.filter((_, index) => index !== varietyIndex);
        setProduct({ ...product, varieties: updatedVarieties });
        toast.success("Variety deleted successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete variety.");
      }
    } catch (error) {
      console.error("Error deleting variety:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleEditVariety = (variety: any, index: number) => {
    setEditingVariety({ variety, index });
  };

  const handleUpdateVariety = async (updatedVariety: any) => {
    console.log('updatedVariety', updatedVariety);
    
    if (editingVariety) {
      const updatedVarieties = product?.varieties.map((variety, index) =>
        index === editingVariety.index ? updatedVariety : variety
      );

      // Update the product in the database
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/varieties`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: product._id,
            varieties: updatedVarieties, // Ensure this is an array
          }),
        });

        if (response.ok) {
          setProduct({ ...product, varieties: updatedVarieties });
          toast.success("Variety updated successfully!");
          setEditingVariety(null); // Reset editing state
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "Failed to update variety.");
        }
      } catch (error) {
        console.error("Error updating variety:", error);
        toast.error("An unexpected error occurred.");
      }
    }
  };

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
        <CardTitle>{product.model_3d_url && "3D"} Product Details </CardTitle>
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
        <div>ID: {product.id}</div>
        <div><strong>SKU:</strong> {product.sku}</div>
        <div><strong>English Name:</strong> {product.en_name}</div>
        <div><strong>Arabic Name:</strong> {product.ar_name}</div>
        <div><strong>Price:</strong> KD {product.price.toFixed(2)}</div>
        <div><strong>Quantity on Hand:</strong> {product.quantity_on_hand}</div>
        <div><strong>Sold Quantity:</strong> {product.sold_quantity}</div>
        <div><strong>Soldering:</strong> {product.is_soldering ? "Yes" : "No"}</div>
        <div><strong>Priority Index:</strong> {product.priorityIndex ? product.priorityIndex : "Default (0)"}</div>
        {product.image && (
          <div>
            <strong>Image:</strong>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image.split(',')[0]} alt={product.en_name} className="mt-2 w-32 h-32 object-cover" />
          </div>
        )}

        {/* Render varieties if they exist */}
        {product.hasVarieties && product.varieties && product.varieties.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Varieties:</h3>
            <ul className="list-disc md:pl-5 space-y-2">
              {product.varieties.map((variety, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div>
                    <strong>{variety.en_name_variant}</strong> - KD {variety.price.toFixed(2)}
                    {variety.image && (
                      <div>
                        <img src={variety.image} alt={variety.en_name_variant} className="mt-2 w-16 h-16 object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditVariety(variety, index)}>
                      <Edit/>
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteVariety(index)}>
                      <Trash2/>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={() => setIsAddingVariety(true)}>Add Variety</Button> {/* Button to open the variety form */}

      </CardContent>
      {isAddingVariety && <AddVarietyForm productId={product._id} onClose={() => setIsAddingVariety(false)} onSubmit={handleUpdateVariety} />} {/* Render the variety form */}
      {editingVariety && (
        <AddVarietyForm
          productId={product._id}
          initialValues={editingVariety.variety}
          onClose={() => setEditingVariety(null)}
          onSubmit={handleUpdateVariety}
        />
      )}
    </Card>
  )
}