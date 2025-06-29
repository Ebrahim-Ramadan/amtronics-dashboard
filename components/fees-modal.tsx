"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash } from "lucide-react"

interface Fee {
  id: number
  label: string
  value: number
}

interface FeesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (totalFees: number) => void
}

const STORAGE_KEY = "fees-calculator-data"

// Helper function to load and validate fees from localStorage
const loadFeesFromStorage = (): Fee[] => {
  try {
    const storedFees = localStorage.getItem(STORAGE_KEY);
    if (storedFees) {
      const parsedFees = JSON.parse(storedFees);
      if (
        Array.isArray(parsedFees) &&
        parsedFees.every(
          (fee) =>
            typeof fee === "object" &&
            "id" in fee &&
            "label" in fee &&
            "value" in fee &&
            typeof fee.id === "number" &&
            typeof fee.label === "string" &&
            typeof fee.value === "number"
        )
      ) {
        return parsedFees;
      }
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY);
      console.warn("Invalid fees data in localStorage, cleared and using defaults.");
    }
  } catch (error) {
    console.error("Failed to load fees from localStorage", error);
    localStorage.removeItem(STORAGE_KEY);
  }
  // Default fees if no valid data
  return [
    { id: 1, label: "Logistics Fees", value: 0 },
    { id: 2, label: "Administration Fees", value: 0 },
  ];
};

export function FeesModal({ open, onOpenChange, onSubmit }: FeesModalProps) {
  // Initialize state with data from localStorage
  const [fees, setFees] = useState<Fee[]>(loadFeesFromStorage());
  const [nextId, setNextId] = useState(() => {
    const loadedFees = loadFeesFromStorage();
    return loadedFees.length > 0 ? Math.max(...loadedFees.map((f) => f.id)) + 1 : 3;
  });

  // Save fees to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fees));
    } catch (error) {
      console.error("Failed to save fees to localStorage", error);
    }
  }, [fees]);

  const handleAddFee = () => {
    setFees([...fees, { id: nextId, label: "", value: 0 }]);
    setNextId(nextId + 1);
  };

  const handleFeeChange = (id: number, field: "label" | "value", value: string | number) => {
    setFees(
      fees.map((fee) =>
        fee.id === id ? { ...fee, [field]: field === "value" ? Number(value) || 0 : value } : fee
      )
    );
  };

  const handleRemoveFee = (id: number) => {
    setFees(fees.filter((fee) => fee.id !== id));
  };

  const handleSubmit = () => {
    const totalFees = fees.reduce((sum, fee) => sum + fee.value, 0);
    onSubmit(totalFees);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Calculate Net Profit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2 max-h-64 py-2 overflow-y-auto pr-4">
            {fees.map((fee) => (
              <div key={fee.id} className="grid grid-cols-12 items-center gap-2">
                <Input
                  placeholder="Fee Label"
                  value={fee.label}
                  onChange={(e) => handleFeeChange(fee.id, "label", e.target.value)}
                  className="col-span-6"
                />
                <div className="col-span-5 relative">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={fee.value}
                    onChange={(e) => handleFeeChange(fee.id, "value", e.target.value)}
                    className="pl-7"
                    min="0"
                  />
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-sm text-muted-foreground">
                    KD
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFee(fee.id)}
                  className="col-span-1"
                  // disabled={fees.length === 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={handleAddFee}>
            Add New Fee
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Calculate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeesModal;