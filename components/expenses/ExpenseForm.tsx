"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Expense {
  _id?: string;
  name: string;
  cost: number;
  quantity?: number;
  note?: string;
  date: string; // ISO
}

export default function ExpenseForm({ initialExpense }: { initialExpense: Expense | null }) {
  const [name, setName] = useState(initialExpense?.name ?? "");
  const [cost, setCost] = useState(initialExpense?.cost?.toString() ?? "");
  const [quantity, setQuantity] = useState(initialExpense?.quantity?.toString() ?? "1");
  const [note, setNote] = useState(initialExpense?.note ?? "");
  const [date, setDate] = useState(initialExpense?.date?.slice(0,10) ?? new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialExpense) {
      setName(initialExpense.name);
      setCost(String(initialExpense.cost));
      setQuantity(String(initialExpense.quantity ?? 1));
      setNote(initialExpense.note ?? "");
      setDate(initialExpense.date?.slice(0,10) ?? new Date().toISOString().slice(0,10));
    }
  }, [initialExpense]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!name || cost === "" || isNaN(Number(cost))) {
        toast.error("Please provide valid name and cost");
        setLoading(false);
        return;
      }
      const payload = {
        name,
        cost: Number(cost),
        quantity: Number(quantity) || 1,
        note,
        date: new Date(date).toISOString(),
      };
      const url = initialExpense ? "/api/expenses" : "/api/expenses";
      const method = initialExpense ? "PATCH" : "POST";
      const body = initialExpense ? { id: initialExpense._id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      toast.success(initialExpense ? "Expense updated" : "Expense added");
      // simple page reload to refresh server rendered data
      setTimeout(() => location.reload(), 300);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>Cost</Label>
        <Input type="number" step="any" value={cost} onChange={(e) => setCost(e.target.value)} required />
      </div>
      <div>
        <Label>Quantity</Label>
        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div>
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="md:col-span-4">
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="md:col-span-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialExpense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}