"use client";
import { useState, useMemo } from "react";
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

  // New: filter range state ('30' days, '60' days, '180' days, '365' days, 'all')
  const [range, setRange] = useState<'30' | '60' | '180' | '365' | 'all'>('all');

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

  // Helper: compute start date for selected range
  const startDate = useMemo(() => {
    const now = new Date();
    if (range === 'all') return null;
    const days = Number(range);
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    // clear time to start-of-day for inclusive comparison
    d.setHours(0,0,0,0);
    return d;
  }, [range]);

  // Filtered expenses used both for display and exports
  const filteredExpenses = useMemo(() => {
    if (!startDate) return expenses;
    const now = new Date();
    return expenses.filter(e => {
      if (!e.date) return false; // treat missing date as outside range (only included in 'all')
      const d = new Date(e.date);
      return d >= startDate && d <= now;
    });
  }, [expenses, startDate]);

  // Export to Excel (use filteredExpenses)
  const handleExportExcel = () => {
    const data = filteredExpenses.map(e => ({
      Name: e.name,
      Cost: e.cost,
      Quantity: e.quantity ?? 1,
      Date: e.date ? new Date(e.date).toLocaleDateString() : "",
      Note: e.note || "",
    }));
    const ws = XLSXUtils.json_to_sheet(data);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Expenses");
    XLSXWriteFile(wb, `expenses-${range === 'all' ? 'all' : `${range}d`}.xlsx`);
  };

  // Export to PDF (use filteredExpenses)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Expenses", 14, 10);
    autoTable(doc, {
      head: [["Name", "Cost", "Qty", "Date", "Note"]],
      body: filteredExpenses.map(e => [
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
    doc.save(`expenses-${range === 'all' ? 'all' : `${range}d`}.pdf`);
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

      {/* Filter + Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1"
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 2 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <div className="text-sm text-gray-600 ml-2">
            Showing {filteredExpenses.length} / {expenses.length}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleExportExcel} disabled={filteredExpenses.length === 0}>Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={filteredExpenses.length === 0}>Export PDF</Button>
        </div>
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
            {filteredExpenses.map(e => (
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
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No expenses for selected range.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}