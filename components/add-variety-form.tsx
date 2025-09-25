"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddVarietyFormProps {
  productId: any;
  onClose: () => void;
  initialValues?: {
    en_name_variant: string;
    price: number;
    image?: string;
  };
  onSubmit: (variety: { en_name_variant: string; price: number; image?: string }) => void;
}

export function AddVarietyForm({ productId, onClose, initialValues, onSubmit }: AddVarietyFormProps) {
  const [enNameVariant, setEnNameVariant] = useState(initialValues?.en_name_variant || "");
  const [price, setPrice] = useState(initialValues?.price || 0);
  const [image, setImage] = useState(initialValues?.image || "");

  useEffect(() => {
    if (initialValues) {
      setEnNameVariant(initialValues.en_name_variant);
      setPrice(initialValues.price);
      setImage(initialValues.image || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const varietyData = {
      en_name_variant: enNameVariant,
      price,
      image,
    };

    try {
      let response;
      
      if (initialValues) {
        // This is an edit - but we don't actually make an API call here for editing
        // The editing is handled by the parent component
        onSubmit(varietyData);
        toast.success("Variety updated successfully!");
        onClose();
        return;
      } else {
        // This is adding a new variety
        response = await fetch('/api/products/varieties', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            variety: varietyData, // Send as 'variety' object for POST
          }),
        });
      }

      if (response && response.ok) {
        onSubmit(varietyData);
        toast.success("Variety added successfully!");
        onClose();
      } else if (response) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to process variety.");
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