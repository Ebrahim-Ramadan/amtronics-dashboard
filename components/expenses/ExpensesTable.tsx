"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ExpenseForm from "./ExpenseForm";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Expense {
  _id: string;
  name: string;
  cost: number;
  quantity?: number;
  note?: string;
  date?: string;
}

export default function ExpensesTable({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [editing, setEditing] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      setExpenses((p) => p.filter(x => x._id !== id));
      toast.success("Expense deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete");
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = expenses.map(e => ({
      Name: e.name,
      Cost: e.cost,
      Quantity: e.quantity ?? 1,
      Date: e.date ? new Date(e.date).toLocaleDateString() : "",
      Note: e.note || "",
    }));
    const ws = XLSXUtils.json_to_sheet(data);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Expenses");
    XLSXWriteFile(wb, "expenses.xlsx");
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Expenses", 14, 10);
    autoTable(doc, {
      head: [["Name", "Cost", "Qty", "Date", "Note"]],
      body: expenses.map(e => [
        e.name,
        `${e.cost.toFixed(2)} KWD`,
        e.quantity ?? 1,
        e.date ? new Date(e.date).toLocaleDateString() : "",
        e.note || "",
      ]),
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 14, right: 14 }
    });
    doc.save("expenses.pdf");
  };

  return (
    <div className="space-y-4">
      {editing && (
        <div className="p-4 border rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Edit Expense</h3>
            <Button variant="outline" onClick={() => setEditing(null)}>Close</Button>
          </div>
          <ExpenseForm initialExpense={editing} />
        </div>
      )}

      <div className="flex gap-2 mb-2 justify-end">
        <Button variant="outline" onClick={handleExportExcel}>Export Excel</Button>
        <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto"> 
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Cost</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Date</th>
              <th className="p-2">Note</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e._id} className="border-t">
                <td className="p-2">{e.name}</td>
                <td className="p-2">{e.cost.toFixed(2)} KWD</td>
                <td className="p-2">{e.quantity ?? 1}</td>
                <td className="p-2">{e.date ? new Date(e.date).toLocaleDateString() : ""}</td>
                <td className="p-2">{e.note}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing(e)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(e._id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}