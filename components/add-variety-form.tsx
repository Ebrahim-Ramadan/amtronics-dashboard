"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input" // Import Shadcn Input component
import { Label } from "@/components/ui/label" // Import Shadcn Label component

interface AddVarietyFormProps {
  productId: any; // Product ID to associate the variety with
  onClose: () => void; // Function to close the form
  initialValues?: { // Optional initial values for editing
    en_name_variant: string;
    price: number;
    image?: string;
  };
  onSubmit: (variety: { en_name_variant: string; price: number; image?: string }) => void; // Callback for form submission
}

export function AddVarietyForm({ productId, onClose, initialValues, onSubmit }: AddVarietyFormProps) {
  const [enNameVariant, setEnNameVariant] = useState(initialValues?.en_name_variant || ""); // Name
  const [price, setPrice] = useState(initialValues?.price || 0); // Price
  const [image, setImage] = useState(initialValues?.image || ""); // Image (optional)

  useEffect(() => {
    if (initialValues) {
      setEnNameVariant(initialValues.en_name_variant);
      setPrice(initialValues.price);
      setImage(initialValues.image || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = initialValues ? "PATCH" : "POST"; // Determine method based on initialValues
    const endpoint = `/api/products/varieties`; // Set endpoint to the correct path

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          varieties: initialValues ? [ // If editing, send the updated variety in an array
            {
              en_name_variant: enNameVariant,
              price,
              image,
            }
          ] : [ // If adding, send the new variety in an array
            {
              en_name_variant: enNameVariant,
              price,
              image,
            }
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Variety result', result);
        
        // Call onSubmit with the new or updated variety
        onSubmit({ en_name_variant: enNameVariant, price, image });
        toast.success(initialValues ? "Variety updated successfully!" : "Variety added successfully!");
        onClose(); // Close the form
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || (initialValues ? "Failed to update variety." : "Failed to add variety."));
      }
    } catch (error) {
      console.error("Error processing variety:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-2">
      <div>
        <Label className="p-2 font-semibold" htmlFor="enNameVariant">Variant Name</Label>
        <Input
          id="enNameVariant"
          type="text"
          value={enNameVariant}
          onChange={(e) => setEnNameVariant(e.target.value)}
          required
        />
      </div>
      <div>
        <Label className="p-2 font-semibold" htmlFor="price">Variant Price</Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <Label className="p-2 font-semibold" htmlFor="image">Variant Image URL (Optional)</Label>
        <Input
          id="image"
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>
      <Button type="submit">{initialValues ? "Update Variety" : "Add Variety"}</Button>
    </form>
  );
}